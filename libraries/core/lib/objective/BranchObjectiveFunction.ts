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

import { EdgeType } from "@syntest/cfg-core";

import { Encoding } from "../Encoding";
import { SearchSubject } from "../SearchSubject";
import { shouldNeverHappen } from "../util/diagnostics";

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
    const function_ = this._subject.cfg.functions.find(
      (function_) => function_.graph.getNodeById(this._id) !== undefined
    );
    const targetNode = function_.graph.getNodeById(this._id);

    if (!targetNode) {
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
    }

    // Find approach level and ancestor based on node and covered nodes
    const { approachLevel, closestCoveredNode, closestCoveredBranchTrace } =
      this.approachLevel.calculate(
        function_.graph,
        targetNode,
        executionResult.getTraces()
      );

    const outgoingEdges = function_.graph.getOutgoingEdges(
      closestCoveredNode.id
    );

    if (outgoingEdges.length !== 2) {
      // weird
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
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

    const trueOrFalse = trueEdge.target === targetNode.id;

    // if closest covered node is not found, we return the distance to the root branch
    if (!closestCoveredBranchTrace) {
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
    }

    const branchDistance = this.branchDistance.calculate(
      closestCoveredBranchTrace.condition_ast,
      closestCoveredBranchTrace.condition,
      closestCoveredBranchTrace.variables,
      trueOrFalse
    );

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
