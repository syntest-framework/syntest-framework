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
import { SearchSubject } from "../SearchSubject";
import { BranchDistance } from "./calculators/BranchDistance";
import { ApproachLevel } from "./calculators/ApproachLevel";
import { shouldNeverHappen } from "../../util/diagnostics";

/**
 * Objective function for the branch criterion.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class BranchObjectiveFunction<
  T extends Encoding
> extends ObjectiveFunction<T> {
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
    approachLevel: ApproachLevel,
    branchDistance: BranchDistance,
    subject: SearchSubject<T>,
    id: string,
    line: number,
    type: boolean
  ) {
    super(approachLevel, branchDistance);
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

    // let's check if the node is covered
    if (executionResult.coversId(this._id)) {
      return 0;
    }

    // find the corresponding node inside the cfg
    const targetNode = this._subject.cfg.getNodeById(this._id);

    if (!targetNode) {
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
    }

    // Find approach level and ancestor based on node and covered nodes
    const { approachLevel, closestCoveredBranchTrace } =
      this.approachLevel.calculate(
        this._subject.cfg,
        targetNode,
        executionResult.getTraces()
      );

    // if closest covered node is not found, we return the distance to the root branch
    if (!closestCoveredBranchTrace) {
      throw new Error(shouldNeverHappen("BranchObjectiveFunction"));
    }

    const branchDistance = this.branchDistance.calculate(
      closestCoveredBranchTrace.condition_ast,
      closestCoveredBranchTrace.condition,
      closestCoveredBranchTrace.variables
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
