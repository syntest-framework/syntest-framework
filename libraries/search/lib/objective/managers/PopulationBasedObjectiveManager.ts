/*
 * Copyright 2020-2023 SynTest contributors
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

import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../ObjectiveFunction";

import { ObjectiveManager } from "./ObjectiveManager";

/**
 * An abstract objective manager for algorithms based on populations.
 */
export abstract class PopulationBasedObjectiveManager<
  T extends Encoding
> extends ObjectiveManager<T> {
  /**
   * @inheritdoc
   */
  protected _handleCoveredObjective(
    objectiveFunction: ObjectiveFunction<T>,
    _encoding: T
  ): ObjectiveFunction<T>[] {
    // Update the objectives
    return this._updateObjectives(objectiveFunction);
  }

  /**
   * @inheritdoc
   */
  protected _handleUncoveredObjective(
    _objectiveFunction: ObjectiveFunction<T>,
    _encoding: T,
    _distance: number
  ): void {
    // Do nothing
  }

  /**
   * The finalization step is used to update the archive with the final population.
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  public override finalize(finalPopulation: T[]): void {
    for (const encoding of finalPopulation) {
      if (encoding.getExecutionResult) {
        for (const objective of this._currentObjectives) {
          if (encoding.getDistance(objective) === 0) {
            ObjectiveManager.LOGGER.debug("updating archive");
            this._archive.update(objective, encoding, true);
          }
        }
      }
    }
  }
}
