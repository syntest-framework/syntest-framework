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

import { EdgeType } from "@syntest/cfg";

import { Encoding } from "../Encoding";
import { SearchSubject } from "../SearchSubject";
import {
  lessThanTwoOutgoingEdges,
  moreThanTwoOutgoingEdges,
  shouldNeverHappen,
} from "../util/diagnostics";

import { ControlFlowBasedObjectiveFunction } from "./ControlFlowBasedObjectiveFunction";
import { ApproachLevel } from "./heuristics/ApproachLevel";
import { BranchDistance } from "./heuristics/BranchDistance";

/**
 * Objective function for the branch criterion.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class BranchObjectiveFunction<
  T extends Encoding
> extends ControlFlowBasedObjectiveFunction<T> {
  protected _subject: SearchSubject<T>;
  protected _id: string;

  /**
   * Constructor.
   *
   * @param subject
   * @param id
   */
  constructor(
    approachLevel: ApproachLevel,
    branchDistance: BranchDistance,
    subject: SearchSubject<T>,
    id: string
  ) {
    super(approachLevel, branchDistance);
    this._subject = subject;
    this._id = id;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();

    if (executionResult === undefined) {
      return Number.MAX_VALUE;
    }

    // let's check if the node is covered
    if (executionResult.coversId(this._id)) {
      return 0;
    }

    // find the corresponding node inside the cfg
    const functions_ = this._subject.cfg.functions.filter(
      (function_) => function_.graph.getNodeById(this._id) !== undefined
    );

    if (functions_.length !== 1) {
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
    }

    const function_ = functions_[0];

    const targetNode = function_.graph.getNodeById(this._id);

    if (!targetNode) {
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
    }

    // Find approach level and ancestor based on node and covered nodes
    const {
      approachLevel,
      closestCoveredNode,
      closestCoveredBranchTrace,
      lastEdgeType,
    } = this.approachLevel.calculate(
      function_.graph,
      targetNode,
      executionResult.getTraces()
    );

    if (closestCoveredNode === undefined) {
      // if closest node is not found, we return the distance to the root branch
      // this happens when the function is not entered at all
      return Number.MAX_VALUE;
    }

    const outgoingEdges = function_.graph.getOutgoingEdges(
      closestCoveredNode.id
    );

    if (outgoingEdges.length < 2) {
      // weird
      throw new Error(
        lessThanTwoOutgoingEdges(closestCoveredNode.id, this._id)
      );
    }

    if (outgoingEdges.length > 2) {
      // weird
      throw new Error(
        moreThanTwoOutgoingEdges(closestCoveredNode.id, this._id)
      );
    }

    const trueEdge = outgoingEdges.find(
      (edge) => edge.type === EdgeType.CONDITIONAL_TRUE
    );
    const falseEdge = outgoingEdges.find(
      (edge) => edge.type === EdgeType.CONDITIONAL_FALSE
    );

    if (!trueEdge || !falseEdge) {
      // weird
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
    }

    // if closest covered node is not found, we return the distance to the root branch
    if (!closestCoveredBranchTrace) {
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
    }

    let trace;
    if (lastEdgeType) {
      const trueNode = trueEdge.target;
      trace = executionResult
        .getTraces()
        .find((trace) => trace.id === trueNode && trace.type === "branch");
    } else {
      const falseNode = falseEdge.target;
      trace = executionResult
        .getTraces()
        .find((trace) => trace.id === falseNode && trace.type === "branch");
    }

    let branchDistance = this.branchDistance.calculate(
      trace.condition_ast,
      trace.condition,
      trace.variables,
      lastEdgeType
    );

    if (Number.isNaN(approachLevel)) {
      throw new TypeError(shouldNeverHappen("ObjectiveManager"));
    }

    if (Number.isNaN(branchDistance)) {
      console.log("branch distance is wrong");
      console.log(this.getIdentifier());
      console.log(approachLevel);
      console.log(branchDistance);
      console.log(trace.condition);
      console.log(trace.variables);
      console.log();
      throw new TypeError(shouldNeverHappen("ObjectiveManager"));
    }

    if (Number.isNaN(approachLevel + branchDistance)) {
      throw new TypeError(shouldNeverHappen("ObjectiveManager"));
    }

    if (branchDistance === 0) {
      console.log("branchdistance is zero");
      console.log(this.getIdentifier());
      console.log(approachLevel);
      console.log(branchDistance);
      console.log(trace.condition);
      console.log(trace.variables);
      console.log();

      branchDistance += 0.999;
    }

    // if (branchDistance === 0 && approachLevel !== 0) {
    //   throw new Error(shouldNeverHappen("ObjectiveManager"));
    // }

    // add the distances
    return approachLevel + branchDistance;
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
