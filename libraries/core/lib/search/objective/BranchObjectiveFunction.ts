/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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

import { ObjectiveFunction } from "../objective/ObjectiveFunction";
import { Encoding } from "../Encoding";
import { ControlFlowGraph, Node, NodeType } from "@syntest/cfg-core";
import { SearchSubject } from "../SearchSubject";
import { BranchDistance } from "../objective/BranchDistance";
import { Datapoint } from "../../util/Datapoint";
import { ApproachLevel } from "./ApproachLevel";

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
    const branchNode = this._subject.cfg.findNodeOfTypeByLine(
      this._line,
      NodeType.Branch
    );

    // TODO maybe childNode is not required.
    const childEdge = this._subject.cfg.edges.find((edge) => {
      return edge.from === branchNode.id && edge.branchType === this._type;
    });
    const childNode = this._subject.cfg.nodes.find((node) => {
      return node.id === childEdge.to;
    });

    // Find approach level and ancestor based on node and covered nodes
    const { approachLevel, closestCoveredBranchTrace } =
      ApproachLevel.calculate(
        this._subject.cfg,
        childNode,
        executionResult.getTraces()
      );

    // if closer node (branch or probe) is not found, we return the distance to the root branch
    if (!closestCoveredBranchTrace) {
      return Number.MAX_VALUE;
    }

    let branchDistance: number;
    if (closestCoveredBranchTrace.type === "function") branchDistance = 1;
    else branchDistance = this.computeBranchDistance(closestCoveredBranchTrace);

    // add the distances
    return approachLevel + branchDistance;
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