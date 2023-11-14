/*
 * Copyright 2020-2021 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { ControlFlowProgram, EdgeType } from "@syntest/cfg";
import { getLogger, Logger } from "@syntest/logging";

import { Encoding } from "../Encoding";
import { ExecutionResult } from "../ExecutionResult";
import {
  moreThanTwoOutgoingEdges,
  shouldNeverHappen,
} from "../util/diagnostics";

import { BranchObjectiveFunction } from "./branch/BranchObjectiveFunction";
import { ApproachLevelCalculator } from "./heuristics/ApproachLevelCalculator";
import { BranchDistanceCalculator } from "./heuristics/BranchDistanceCalculator";
import { ObjectiveFunction } from "./ObjectiveFunction";

/**
 * Objective function based on control flow graph calculations.
 */
export abstract class ControlFlowBasedObjectiveFunction<
  T extends Encoding
> extends ObjectiveFunction<T> {
  protected controlFlowProgram: ControlFlowProgram;
  protected approachLevelCalculator: ApproachLevelCalculator;
  protected branchDistanceCalculator: BranchDistanceCalculator;
  protected static LOGGER: Logger;

  constructor(
    id: string,
    controlFlowProgram: ControlFlowProgram,
    approachLevelCalculator: ApproachLevelCalculator,
    branchDistanceCalculator: BranchDistanceCalculator
  ) {
    super(id);
    ControlFlowBasedObjectiveFunction.LOGGER = getLogger(
      ControlFlowBasedObjectiveFunction.name
    );

    this.controlFlowProgram = controlFlowProgram;
    this.approachLevelCalculator = approachLevelCalculator;
    this.branchDistanceCalculator = branchDistanceCalculator;
  }

  protected getMatchingFunctionGraph(nodeId: string) {
    // find the function that corresponds with this node id
    const functions_ = this.controlFlowProgram.functions.filter(
      (function_) => function_.graph.getNodeById(nodeId) !== undefined
    );

    if (functions_.length !== 1) {
      throw new Error(
        shouldNeverHappen(ControlFlowBasedObjectiveFunction.name)
      );
    }

    const function_ = functions_[0];

    return function_.graph;
  }

  /**
   * Calculating the distance for a single encoding
   *
   * This returns a number structured as follows: XX.YYZZZZ
   * Where:
   * - XX is the approach level
   * - YY is the fraction of uncovered statements within the block
   * - ZZZZ is the branch distance from the objective
   *
   * @param encoding
   * @returns
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  protected _calculateControlFlowDistance(
    id: string,
    executionResult: ExecutionResult
  ): number {
    // find the function that corresponds with this branch
    const graph = this.getMatchingFunctionGraph(id);
    const targetNode = graph.getNodeById(id);

    // Find approach level and ancestor based on node and covered nodes
    const {
      approachLevel,
      closestCoveredNode,
      closestCoveredBranchTrace,
      lastEdgeType,
      statementFraction,
    } = this.approachLevelCalculator.calculate(
      graph,
      targetNode,
      executionResult.getTraces()
    );

    if (closestCoveredNode === undefined) {
      // if closest node is not found, we return the distance to the root branch
      // this happens when the function is not entered at all
      return Number.MAX_VALUE;
    }

    const outgoingEdges = graph.getOutgoingEdges(closestCoveredNode.id);

    if (statementFraction !== -1 && statementFraction !== 1) {
      // Here we use the fractions of unreached statements to generate a number between 0.01 and 0.99
      // It must be larger than 0 otherwise it seems like the node is actually covered
      // It must be smaller than 1 otherwise it would be the same as one further node in the approach level
      // This represents the YY part in the distance (XX.YYZZZZ)
      let distance = (1 - statementFraction) * 0.98 + 0.01;
      distance = Math.round(distance * 100) / 100;
      return approachLevel + distance;
    }

    if (outgoingEdges.length < 2) {
      // end of block problem
      // when a crash happens at the last line of a block the statement fraction becomes 1 since we do not record the last one
      if (statementFraction === 1) {
        return approachLevel + 0.01;
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
      throw new Error(moreThanTwoOutgoingEdges(closestCoveredNode.id, id));
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
      throw new TypeError(shouldNeverHappen(BranchObjectiveFunction.name));
    }

    let branchDistance = this.branchDistanceCalculator.calculate(
      trace.condition,
      trace.variables,
      lastEdgeType
    );

    if (Number.isNaN(approachLevel)) {
      throw new TypeError(shouldNeverHappen(BranchObjectiveFunction.name));
    }

    if (Number.isNaN(branchDistance)) {
      throw new TypeError(shouldNeverHappen(BranchObjectiveFunction.name));
    }

    if (Number.isNaN(approachLevel + branchDistance)) {
      throw new TypeError(shouldNeverHappen(BranchObjectiveFunction.name));
    }

    if (branchDistance === 0) {
      // TODO there can still be a crash inside of the if statement giving this result
      ControlFlowBasedObjectiveFunction.LOGGER.warn("branch distance is zero");
      branchDistance += 0.999;
    }

    // add the distances
    // We divide the branch distance by 100 to "free up" the YY part of the distance metric
    // The branch distance represents the ZZZZ part in the distance (XX.YYZZZZ)
    return approachLevel + branchDistance / 100;
  }
}
