/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core sFuzz plugin.
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

import * as crypto from "node:crypto";

import {
  BudgetManager,
  Encoding,
  ExceptionObjectiveFunction,
  StructuralObjectiveManager,
} from "@syntest/search";

/**
 * sFuzz objective manager
 *
 * Based on:
 * sFuzz: An Efficient Adaptive Fuzzer for Solidity Smart Contracts
 * Tai D. Nguyen, Long H. Pham, Jun Sun, Yun Lin, Quang Tran Minh
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 */
export class SFuzzObjectiveManager<
  T extends Encoding
> extends StructuralObjectiveManager<T> {
  /**
   * @inheritdoc
   */
  public override async evaluateOne(
    encoding: T,
    budgetManager: BudgetManager<T>
  ): Promise<void> {
    // Execute the encoding
    const result = await this._runner.execute(this._subject, encoding);
    budgetManager.evaluation(encoding);

    // Store the execution result in the encoding
    encoding.setExecutionResult(result);

    // For all current objectives
    for (const objectiveFunction of this._currentObjectives) {
      // Calculate and store the distance
      const distance = objectiveFunction.calculateDistance(encoding);
      if (distance > 1) {
        // This is to ignore the approach level
        encoding.setDistance(objectiveFunction, 1);
      } else {
        encoding.setDistance(objectiveFunction, distance);
      }

      // When the objective is covered, update the objectives and the archive
      if (distance === 0) {
        // Update the objectives
        this._updateObjectives(objectiveFunction);

        // Update the archive
        this._updateArchive(objectiveFunction, encoding);
      }
    }

    // Create separate exception objective when an exception occurred in the execution
    if (result.hasExceptions()) {
      // TODO there must be a better way
      //  investigate error patterns somehow

      const hash = crypto
        .createHash("md5")
        .update(result.getExceptions())
        .digest("hex");

      const numberOfExceptions = this._archive
        .getObjectives()
        .filter((objective) => objective instanceof ExceptionObjectiveFunction)
        .filter((objective) => objective.getIdentifier() === hash).length;
      if (numberOfExceptions === 0) {
        // TODO this makes the archive become too large crashing the tool
        this._archive.update(
          new ExceptionObjectiveFunction(
            this._subject,
            hash,
            result.getExceptions()
          ),
          encoding
        );
      }
    }
  }
}
