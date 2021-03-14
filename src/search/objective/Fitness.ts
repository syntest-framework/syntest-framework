import { Datapoint, getLogger, TestCaseRunner, Target, TestCase } from "../..";
import { Objective } from "./Objective";
import { Evaluation } from "./Evaluation";
import { Node } from "../../graph/Node";
import { Edge } from "../../graph/Edge";
import { CFG } from "../../graph/CFG";

const { Graph, alg } = require("@dagrejs/graphlib");

/**
 * Class for evaluating individuals or entire populations.
 *
 * @author Dimitri Stallenberg
 * @author Annibale Panichella
 */
export class Fitness {
  private runner: TestCaseRunner;
  private target: Target;
  private paths: any;

  private _evaluations: number;

  /**
   * Constructor
   */
  constructor(runner: TestCaseRunner, target: Target) {
    this.runner = runner;
    this.target = target;
    this._evaluations = 0;
    this.extractPaths(target.cfg);
  }

  extractPaths(cfg: CFG) {
    const g = new Graph();

    for (const node of cfg.nodes) {
      g.setNode(node.id);
    }

    for (const edge of cfg.edges) {
      g.setEdge(edge.from, edge.to);
      g.setEdge(edge.to, edge.from);
    }

    this.paths = alg.dijkstraAll(g, (e: any) => {
      const edge = cfg.edges.find((edge: Edge) => {
        if (
          String(edge.from) === String(e.v) &&
          String(edge.to) === String(e.w)
        ) {
          return true;
        }

        return (
          String(edge.from) === String(e.w) && String(edge.to) === String(e.v)
        );
      });
      if (!edge) {
        getLogger().error(`Edge not found during dijkstra operation.`);
        process.exit(1);
      }

      return edge.type === "-" ? 2 : 1;
    });
  }

  /**
   * This function evaluates an individual.
   *
   * @param individual the individual to evaluate
   * @param objectives the objectives to evaluate
   */
  async evaluateOne(individual: TestCase, objectives: Objective[]) {
    getLogger().debug(`Evaluating individual ${individual.id}`);

    const dataPoints = await this.runner.runTestCase(individual);

    individual.setEvaluation(this.calculateDistance(dataPoints, objectives));
    this._evaluations += 1;
  }

  /**
   * This function evaluates a population of individuals.
   *
   * @param population the population to evaluate
   * @param objectives the objectives to evaluate the population on
   */
  async evaluateMany(population: TestCase[], objectives: Objective[]) {
    // TODO This should be done in parallel somehow
    for (const individual of population) {
      await this.evaluateOne(individual, objectives);
    }
  }

  /**
   * Calculate the branch distance
   *
   * @param opcode the opcode (the comparison operator)
   * @param left the left value of the comparison
   * @param right the right value of the comparison
   */
  private calcBranchDistance(opcode: string, left: number, right: number) {
    let trueBranch = 0;
    let falseBranch = 0;
    let difference = Math.log10(Math.abs(left - right) + 1);

    switch (opcode) {
      case "GT":
        if (left > right) {
          falseBranch = 1 - 1 / (difference + 1);
        } else {
          difference += 1;
          trueBranch = 1 - 1 / (difference + 1);
        }
        break;
      case "SGT":
        if (left >= right) {
          difference += 1;
          falseBranch = 1 - 1 / (difference + 1);
        } else {
          trueBranch = 1 - 1 / (difference + 1);
        }
        break;
      case "LT":
        if (left < right) {
          falseBranch = this.normalize(right - left);
        } else {
          difference = (left - right) + 1;
          trueBranch = this.normalize(difference);
        }
        break;
      case "SLT":
        if (left <= right) {
          difference += 1;
          falseBranch = 1 - 1 / (difference + 1);
        } else {
          trueBranch = 1 - 1 / (difference + 1);
        }
        break;
      case "EQ":
        if (left === right) {
          falseBranch = 1;
        } else {
          difference = Math.abs(left-right);
          trueBranch = this.normalize(difference);
        }
        break;
    }

    if (trueBranch === 0) {
      return falseBranch;
    } else {
      return trueBranch;
    }
  }

  normalize(x: number): number{
    return x/(x+1);
  }

  /**
   * Calculates the distance between the branches covered and the uncovered branches.
   *
   * @param dataPoints the cover information
   * @param objectives the objectives/targets we want to calculate the distance to
   */
  private calculateDistance(dataPoints: Datapoint[], objectives: Objective[]) {
    const hitNodes = [];
    // find fitness per objective
    const fitness = new Evaluation();

    for (const point of dataPoints) {
      // Check if the  is a branch or root-branch node  and has been hit
      if (point.type !== "branch" && point.type !== "function") {
        continue;
      }
      // Check if the branch in question is currently an objective
      const objective = this.target.getObjectives().find((o) => {
        return o.locationIdx === point.locationIdx && o.line === point.line;
      });

      if (!objective) {
        continue;
      }

      // find the corresponding branch node inside the cfg
      const branchNode = this.target.cfg.nodes
        .find((n: Node) => {
          return n.locationIdx === point.locationIdx && n.line === point.line;
        });

      if (!branchNode) {
        getLogger().error("Branch node not found!");
        process.exit(1);
      }

      // record hits
      hitNodes.push({
        node: branchNode,
        point: point,
      });
    }

    const nodes = this.target.cfg.nodes.filter(
      (n: any) => n.functionDefinition || n.branchId
    );

    // loop over current objectives
    for (const objective of objectives) {
      // find the node in the CFG object that corresponds to the objective
      const node = nodes.find((n: any) => {
        return (
            (objective.locationIdx === n.locationIdx && objective.line === n.line && (objective as any).type === n.type) ||
            (objective.line === n.line && (objective as any).functionDefinition === n.functionDefinition)
        );
      });

      // No node found so the objective cannot be covered
      if (!node) {
        fitness.set(objective, Number.MAX_VALUE - 1);
        continue;
      }

      // find if the branch was covered
      const hitNode = hitNodes.find((h: any) => h.node === node);

      // if it is covered the distance is 0
      if (hitNode.point.hits > 0) {
        fitness.set(objective, 0);
        continue;
      }

      // if the object is uncovered and it is a root-branch (function node)
      // it means the corresponding function has not been covered
      // in this case we set its distance equal to 1.0
      if ((objective as any).functionDefinition){
        fitness.set(objective, 1);
        continue;
      }

      // find the closest covered branch to the objective branch
      let closestHitNode = null;
      let smallestDistance = Number.MAX_VALUE;
      for (const n of hitNodes) {
        if (n.point.hits == 0 || n.node.functionDefinition) // if the node n has not been covered, we have to skip it
          continue;

        const pathDistance = this.approachLevel(node, n);
        if (smallestDistance > pathDistance) {
          smallestDistance = pathDistance;
          closestHitNode = n;
        }
      }

      if (!closestHitNode) {
        // This is now possible since there can be multiple functions within a class that do not interact
        fitness.set(objective, Number.MAX_VALUE);
        continue;
        // getLogger().error('Closest hit node not found!')
        // getLogger().error(`${JSON.stringify(objective, null, 2)}`)
        // process.exit(1)
      }

      // calculate the branch distance between: covering the branch needed to get a closer approach distance and the currently covered branch
      // always between 0 and 1
      const branchDistance = this.calcBranchDistance(
        closestHitNode.point.opcode,
        closestHitNode.point.left,
        closestHitNode.point.right
      );

      // add the distances
      const distance = smallestDistance + branchDistance;
      fitness.set(objective, Math.min(distance, fitness.get(objective)));
    }

    return fitness;
  }

  get evaluations(): number {
    return this._evaluations;
  }

  approachLevel(targetNode: Node, closestNode: any): number{
    // the approach distance is equal to the path length between the closest covered branch and the objective branch
    // let value = this.paths[targetNode.id][closestNode.node.id].distance;
    //  value = Math.max(smallestDistance - 1, 0);
    if (targetNode.line == closestNode.node.line)
      return 0

    if ((targetNode as any).branchId == (closestNode.node as any).branchId)
      return 0

    return 1;

  }
}
