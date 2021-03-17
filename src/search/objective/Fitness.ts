import { Datapoint, getLogger, TestCaseRunner, Target, TestCase } from "../..";
import { Objective } from "./Objective";
import { Evaluation } from "./Evaluation";
import { Node } from "../../graph/Node";
import { Edge } from "../../graph/Edge";
import { CFG } from "../../graph/CFG";
import {BranchDistance} from "./BranchDistance";

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
  private branchDistance: BranchDistance;

  /**
   * Constructor
   */
  constructor(runner: TestCaseRunner, target: Target) {
    this.runner = runner;
    this.target = target;
    this._evaluations = 0;
    this.branchDistance = new BranchDistance();
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
   * Calculates the distance between the branches covered and the uncovered branches.
   *
   * @param dataPoints the cover information
   * @param objectives the objectives/targets we want to calculate the distance to
   */
  private calculateDistance(dataPoints: Datapoint[], objectives: Objective[]) {
    const fitness = new Evaluation();

    // calculate coverage for function calls (root branches)
    this.calculateFunctionCoverage(objectives, dataPoints, fitness);

    // calculate coverage for the branches
    const hitNodes = [];

    for (const point of dataPoints) {
      // Check if it is a branch node and has been hit
      if (point.type !== "branch" || point.hits === 0) {
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
      const node = nodes.find((n) => {
        return (
            objective.locationIdx === n.locationIdx && objective.line === n.line
        );
      });

      // No node found so the objective is uncoverable
      if (!node) {
        fitness.set(objective, Number.MAX_VALUE - 1);
        continue;
      }

      // find if the branch was covered
      const hitNode = hitNodes.find((h: any) => h.node === node);

      // if it is covered the distance is 0
      if (hitNode) {
        fitness.set(objective, 0);
        continue;
      }

      // find the closest covered branch to the objective branch
      let closestHitNode = null;
      let smallestDistance = Number.MAX_VALUE;
      for (const n of hitNodes) {
        const pathDistance = this.paths[node.id][n.node.id].distance;
        if (smallestDistance > pathDistance) {
          smallestDistance = pathDistance;
          closestHitNode = n;
        }
      }

      if (!closestHitNode) {
        // This is now possible since there can be multiple functions within a class that do not interact
        continue;
        // getLogger().error('Closest hit node not found!')
        // getLogger().error(`${JSON.stringify(objective, null, 2)}`)
        // process.exit(1)
      }

      // calculate the branch distance between: covering the branch needed to get a closer approach distance and the currently covered branch
      // always between 0 and 1
      const branchDistance = this.branchDistance.branchDistanceNumeric(
          closestHitNode.point.opcode,
          closestHitNode.point.left,
          closestHitNode.point.right,
          !!objective.locationIdx
      );

      let approachLevel = smallestDistance;
      const lineCoverage = dataPoints.filter(
          (n: any) => n.line == node.line && n.type =="line"
      );

      if (lineCoverage.length>0 && lineCoverage[0].hits > 0)
        approachLevel = 0;

      // add the distances
      const distance = approachLevel + branchDistance;
      fitness.set(objective, Math.min(distance, fitness.get(objective)));
    }

    return fitness;
  }

  calculateFunctionCoverage(objectives: Objective[], dataPoints: Datapoint[], fitness: Evaluation){
    for (const objective of objectives){
      if (!(objective as any).absoluteRoot) // not a root branch
        continue;

      const point = dataPoints.find((point) => {
        return objective.line === point.line;
      });

      if (point.hits > 0){
        fitness.set(objective, 0);
      } else {
        fitness.set(objective, 1);
      }
    }
  }

  get evaluations(): number {
    return this._evaluations;
  }
}
