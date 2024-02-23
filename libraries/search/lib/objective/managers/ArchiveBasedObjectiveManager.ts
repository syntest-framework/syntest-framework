/*
 * Copyright 2020-2023 SynTest contributors
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

import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../ObjectiveFunction";

import { ObjectiveManager } from "./ObjectiveManager";

/**
 * An abstract objective manager for algorithms based on an archive.
 */
export abstract class ArchiveBasedObjectiveManager<
  T extends Encoding,
> extends ObjectiveManager<T> {
  /**
   * @inheritdoc
   */
  protected _handleCoveredObjective(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T,
  ): ObjectiveFunction<T>[] {
    // Update the objectives
    const childObjectives = this._updateObjectives(objectiveFunction);

    // Update the archive
    this._updateArchive(objectiveFunction, encoding);

    return childObjectives;
  }

  /**
   * @inheritdoc
   */
  protected _handleUncoveredObjective(
    _objectiveFunction: ObjectiveFunction<T>,
    _encoding: T,
    _distance: number,
  ): void {
    // Do nothing
  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  public finalize(_finalPopulation: T[]): void {
    // pass
  }

  /**
   * Update the archive.
   *
   * @param objectiveFunction
   * @param encoding
   * @protected
   */
  protected _updateArchive(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T,
  ) {
    ObjectiveManager.LOGGER.debug("updating archive");
    if (!this._archive.hasObjective(objectiveFunction)) {
      ObjectiveManager.LOGGER.debug(
        `new objective covered: ${objectiveFunction.getIdentifier()}`,
      );
      this._archive.update(objectiveFunction, encoding, false);
      return;
    }

    // If the objective is already in the archive we use secondary objectives
    const currentEncoding = this._archive.getEncoding(objectiveFunction);

    // Look at secondary objectives when two solutions are found
    for (const secondaryObjective of this._secondaryObjectives) {
      const comparison = secondaryObjective.compare(encoding, currentEncoding);

      // If one of the two encodings is better, don't evaluate the next objectives
      if (comparison != 0) {
        // Override the encoding if the current one is better
        if (comparison > 0) {
          ObjectiveManager.LOGGER.debug(
            "overwriting archive with better encoding",
          );

          this._archive.update(objectiveFunction, encoding, false);
        }
        break;
      }
    }
  }
}
