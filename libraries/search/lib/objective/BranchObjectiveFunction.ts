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
import { getLogger, Logger } from "@syntest/logging";

import { Encoding } from "../Encoding";
import { ExecutionResult } from "../ExecutionResult";
import { SearchSubject } from "../SearchSubject";
import {
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
  protected static LOGGER: Logger;
  constructor(
    approachLevel: ApproachLevel,
    branchDistance: BranchDistance,
    subject: SearchSubject<T>,
    id: string
  ) {
    super(id, subject, approachLevel, branchDistance);
    BranchObjectiveFunction.LOGGER = getLogger("BranchObjectiveFunction");
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();

    if (executionResult === undefined) {
      return Number.MAX_VALUE;
    }

    // check if the branch is covered
    if (executionResult.coversId(this._id)) {
      return 0;
    } else if (this.shallow) {
      return Number.MAX_VALUE;
    } else {
      return this._calculateControlFlowDistance(executionResult);
    }
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  protected _calculateControlFlowDistance(
    executionResult: ExecutionResult
  ): number {
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
      statementFraction,
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

    if (statementFraction !== -1 && statementFraction !== 1) {
      // the statement fraction should never be -1
      // if the statement fraction is 1 it is fully covered
      // TODO    or the error happens at the end of a body where we dont record traces anymore
      // TODO there can still be a crash inside of the if statement making the branch distance still zero

      // TODO this is a hack to give guidance to the algorithm
      // it would be better to improve the cfg with implicit branches
      // or to atleast choose a number based on what statement has been covered in the cfg node
      // 0.25 is based on the fact the branch distance is minimally 0.5 // TODO FALSE!!!!
      // so 0.25 is exactly between 0.5 and 0

      // we add 0.999_999 such that it is less than one but more than the branch distance
      return approachLevel + 0.999_999; // 0.48 * statementFraction + 0.01;
    }

    if (outgoingEdges.length < 2) {
      // todo end of block problem
      // when a crash happens at the last line of a block the statement fraction becomes 1 since we do not record the last one
      if (statementFraction === 1) {
        return approachLevel + 0.499_999_999;
      }

      throw new Error(
        shouldNeverHappen(
          "Statement fraction should not be zero because that means it rashed on the conditional instead of the first statement of a blok, could be that the traces are wrong"
        )
      );
      // return approachLevel + 0.48 * statementFraction + 0.01;
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

    if (trace === undefined) {
      throw new TypeError(shouldNeverHappen("ObjectiveManager"));
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
      throw new TypeError(shouldNeverHappen("ObjectiveManager"));
    }

    if (Number.isNaN(approachLevel + branchDistance)) {
      throw new TypeError(shouldNeverHappen("ObjectiveManager"));
    }

    if (branchDistance === 0) {
      // TODO there can still be a crash inside of the if statement giving this result
      BranchObjectiveFunction.LOGGER.warn("branch distance is zero");
      branchDistance += 0.999;
    }

    // add the distances
    return approachLevel + branchDistance;
  }
}
