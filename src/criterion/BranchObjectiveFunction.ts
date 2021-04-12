import { ObjectiveFunction } from "../search/objective/ObjectiveFunction";
import { Encoding } from "../search/Encoding";
import { Node } from "../graph/Node";
import { getLogger } from "../util/logger";
import { SearchSubject } from "../search/SearchSubject";
import { BranchDistance } from "../search/objective/BranchDistance";

/**
 * Objective function for the branch criterion.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class BranchObjectiveFunction<T extends Encoding>
  implements ObjectiveFunction<T> {
  protected _subject: SearchSubject<T>;
  protected _id: string;
  protected _line: number;
  protected _type: boolean;

  /**
   * Constructor.
   *
   * @param subject
   * @param id
   * @param line
   * @param type
   */
  constructor(
    subject: SearchSubject<T>,
    id: string,
    line: number,
    type: boolean
  ) {
    this._subject = subject;
    this._id = id;
    this._line = line;
    this._type = type;
  }

  /**
   * @inheritDoc
   */
  calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();
    // calculate coverage for the branches
    const hitNodes = [];

    for (const trace of executionResult.getTraces()) {
      // Check if it is a branch node and has been hit
      if (trace.type !== "branch" || trace.hits === 0) {
        continue;
      }

      // Check if the branch in question is currently an objective
      const objective = this._subject
        .getObjectives()
        .filter((objective) => objective instanceof BranchObjectiveFunction)
        .find((objective) => {
          const branchObjective = <BranchObjectiveFunction<T>>objective;
          return (
            branchObjective._line === trace.line
          );
        });

      if (!objective) {
        continue;
      }

      // find the corresponding branch node inside the cfg
      const branchNode = this._subject.cfg.nodes.find((n: Node) => {
        return n.line === trace.line;
      });

      if (!branchNode) {
        getLogger().error("Branch node not found!");
        process.exit(1);
      }

      // record hits
      hitNodes.push({
        node: branchNode,
        point: trace,
      });
    }

    const nodes = this._subject.cfg.nodes.filter(
      (n: any) => n.functionDefinition || n.branchId
    );

    // find the node in the CFG object that corresponds to the objective
    const node = nodes.find((n) => {
      return this._line === n.line;
    });

    // No node found so the objective is uncoverable
    if (!node) {
      return Number.MAX_VALUE;
    }

    // find if the branch was covered
    const hitNode = hitNodes.find((h: any) => h.node === node);

    // if it is covered the distance is 0
    if (hitNode) {
      return 0;
    }

    // find the closest covered branch to the objective branch
    let closestHitNode = null;
    let smallestDistance = Number.MAX_VALUE;
    for (const n of hitNodes) {
      const pathDistance = this._subject.getPath(node.id, n.node.id);
      if (smallestDistance > pathDistance) {
        smallestDistance = pathDistance;
        closestHitNode = n;
      }
    }

    if (!closestHitNode) {
      return Number.MAX_VALUE;
    }

    // calculate the branch distance between: covering the branch needed to get a closer approach distance and the currently covered branch
    // always between 0 and 1
    const branchDistance = BranchDistance.branchDistanceNumeric(
      closestHitNode.point.opcode,
      closestHitNode.point.left,
      closestHitNode.point.right,
      this._type // we look at whether we are optimizing the false or the true branch
    );

    let approachLevel = smallestDistance;
    const lineCoverage = executionResult
      .getTraces()
      .filter((n: any) => n.line == node.line && n.type == "line");

    if (lineCoverage.length > 0 && lineCoverage[0].hits > 0) approachLevel = 0;

    // add the distances
    const distance = approachLevel + branchDistance;
    return distance;
  }

  /**
   * @inheritDoc
   */
  getIdentifier(): string {
    return this._id;
  }

  getSubject(): SearchSubject<T> {
    return this._subject;
  }
}
