/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ObjectiveFunction } from "../search/objective/ObjectiveFunction";
import { Encoding } from "../search/Encoding";
import { Node, NodeType } from "../analysis/static/graph/nodes/Node";
import { SearchSubject } from "../search/SearchSubject";
import { BranchDistance } from "../search/objective/BranchDistance";
import { Datapoint } from "../util/Datapoint";

/**
 * Objective function for the branch criterion.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class BranchObjectiveFunction<T extends Encoding>
  implements ObjectiveFunction<T>
{
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

  calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();

    if (executionResult === undefined) {
      return Number.MAX_VALUE;
    }

    // let's check if the line is covered
    if (executionResult.coversLine(this._line)) {
      const branchTrace = executionResult
        .getTraces()
        .find(
          (trace) =>
            trace.type === "branch" &&
            trace.line === this._line &&
            trace.branchType === this._type
        );

      if (branchTrace.hits > 0) {
        return 0;
      } else {
        const oppositeBranch = executionResult.getTraces().find(
          (trace) =>
            trace.type === "branch" &&
            trace.id === branchTrace.id && // Same branch id
            trace.branchType !== this._type // The opposite branch type
        );

        return BranchDistance.branchDistanceNumeric(
          oppositeBranch.opcode,
          oppositeBranch.left,
          oppositeBranch.right,
          this._type
        );
      }
    }

    // find the corresponding branch node inside the cfg
    const branchNode = this._subject.cfg.nodes.find((n: Node) => {
      return n.type === NodeType.Branch && n.lines.includes(this._line);
    });
    const childEdge = this._subject.cfg.edges.find((edge) => {
      return edge.from === branchNode.id && edge.branchType === this._type;
    });
    const childNode = this._subject.cfg.nodes.find((node) => {
      return node.id === childEdge.to;
    });

    // find the closest covered branch to the objective branch
    let closestHitNode = null;
    let approachLevel = Number.MAX_VALUE;
    for (const n of this._subject.cfg.nodes) {
      const traces = executionResult
        .getTraces()
        .filter(
          (trace) =>
            n.lines.includes(trace.line) &&
            (trace.type === "branch" ||
              trace.type === "probePre" ||
              trace.type === "probePost" ||
              trace.type === "function") &&
            trace.hits > 0
        );
      for (const trace of traces) {
        const pathDistance = this._subject.getPath(n.id, childNode.id);
        if (approachLevel > pathDistance) {
          approachLevel = pathDistance;
          closestHitNode = trace;
        }
      }
    }

    // if closer node (branch or probe) is not found, we return the distance to the root branch
    if (!closestHitNode) {
      return Number.MAX_VALUE;
    }

    let branchDistance: number;

    if (closestHitNode.type === "function") branchDistance = 1;
    else branchDistance = this.computeBranchDistance(closestHitNode);

    // add the distances
    const distance = approachLevel + branchDistance;
    return distance;
  }

  /**
   *  Calculate the branch distance between: covering the branch needed to get a closer approach distance
   *  and the currently covered branch always between 0 and 1
   * @param node
   * @protected
   */
  protected computeBranchDistance(node: Datapoint): number {
    const trueBranch = BranchDistance.branchDistanceNumeric(
      node.opcode,
      node.left,
      node.right,
      true
    );

    const falseBranch = BranchDistance.branchDistanceNumeric(
      node.opcode,
      node.left,
      node.right,
      false
    );

    return Math.max(trueBranch, falseBranch);
  }

  /**
   * @inheritDoc
   */
  getIdentifier(): string {
    return this._id;
  }

  /**
   * @inheritDoc
   */
  getSubject(): SearchSubject<T> {
    return this._subject;
  }
}
