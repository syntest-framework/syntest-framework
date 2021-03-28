import { ObjectiveFunction } from "../search/objective/ObjectiveFunction";
import { Encoding } from "../search/Encoding";
import { Node } from "../graph/Node";
import { getLogger } from "../util/logger";
import { SearchSubject } from "../search/SearchSubject";
import { BranchDistance } from "../search/objective/BranchDistance";

export class BranchObjectiveFunction<T extends Encoding>
  implements ObjectiveFunction<T> {
  protected _subject: SearchSubject<T>;
  protected _line: number;
  protected _locationIdx: number;
  protected _type: boolean;

  constructor(
    subject: SearchSubject<T>,
    line: number,
    locationIdx: number,
    type: boolean
  ) {
    this._subject = subject;
    this._line = line;
    this._locationIdx = locationIdx;
    this._type = type;
  }

  calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();
    // calculate coverage for the branches
    const hitNodes = [];

    for (const point of executionResult.getTraces()) {
      // Check if it is a branch node and has been hit
      if (point.type !== "branch" || point.hits === 0) {
        continue;
      }

      // Check if the branch in question is currently an objective
      const objective = this._subject
        .getObjectives()
        .filter((objective) => objective instanceof BranchObjectiveFunction)
        .find((objective) => {
          const branchObjective = (objective as unknown) as BranchObjectiveFunction<T>;
          return (
            branchObjective._locationIdx === point.locationIdx &&
            branchObjective._line === point.line
          );
        });

      if (!objective) {
        continue;
      }

      // find the corresponding branch node inside the cfg
      const branchNode = this._subject.cfg.nodes.find((n: Node) => {
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

    const nodes = this._subject.cfg.nodes.filter(
      (n: any) => n.functionDefinition || n.branchId
    );

    // find the node in the CFG object that corresponds to the objective
    const node = nodes.find((n) => {
      return this._locationIdx === n.locationIdx && this._line === n.line;
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

  getIdentifier(): string {
    return "";
  }
}
