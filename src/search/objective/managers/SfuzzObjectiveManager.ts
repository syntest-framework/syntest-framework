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

import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../ObjectiveFunction";
import { StructuralObjectiveManager } from "./StructuralObjectiveManager";
import { EncodingRunner } from "../../EncodingRunner";

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
export class SfuzzObjectiveManager<
  T extends Encoding
> extends StructuralObjectiveManager<T> {
  /**
   * Constructor.
   *
   * @param runner Encoding runner
   */
  constructor(runner: EncodingRunner<T>) {
    super(runner);
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected _updateObjectives(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T,
    distance: number
  ): void {
    // When objective is covered update objectives
    if (distance === 0.0) {
      // Remove objective from the current and uncovered objectives
      this._uncoveredObjectives.delete(objectiveFunction);
      this._currentObjectives.delete(objectiveFunction);

      // Add objective to the covered objectives and update the archive
      this._coveredObjectives.add(objectiveFunction);
      if (!this._archive.has(objectiveFunction)) {
        this._archive.update(objectiveFunction, encoding);
      } else {
        // If the objective is already in the archive we save the shortest encoding
        const currentEncoding = this._archive.getEncoding(objectiveFunction);
        if (currentEncoding.getLength() > encoding.getLength())
          this._archive.update(objectiveFunction, encoding);
      }

      // Add the child objectives to the current objectives
      this._subject
        .getChildObjectives(objectiveFunction)
        .forEach((objective) => {
          if (
            !this._coveredObjectives.has(objective) &&
            !this._currentObjectives.has(objective)
          )
            this._currentObjectives.add(objective);
        });
    }

    if (distance > 1) {
      // This is to ignore the approach level
      encoding.setDistance(objectiveFunction, 1);
    }
  }
}
