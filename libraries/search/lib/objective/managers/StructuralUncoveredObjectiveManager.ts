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

import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../ObjectiveFunction";

import { ObjectiveManager } from "./ObjectiveManager";
import { StructuralObjectiveManager } from "./StructuralObjectiveManager";

/**
 * Objective manager that only evaluates an encoding on currently reachable.
 *
 * @author Mitchell Olsthoorn
 */
export class StructuralUncoveredObjectiveManager<
  T extends Encoding
> extends StructuralObjectiveManager<T> {
  /**
   * @inheritDoc
   * @protected
   */
  protected override _updateObjectives(
    objectiveFunction: ObjectiveFunction<T>
  ): ObjectiveFunction<T>[] {
    ObjectiveManager.LOGGER.debug("updating objectives");
    ObjectiveManager.LOGGER.debug(
      `covered: ${objectiveFunction.getIdentifier()}`
    );
    // Remove objective from the current and uncovered objectives
    this._uncoveredObjectives.delete(objectiveFunction);
    this._currentObjectives.delete(objectiveFunction);

    // Add objective to the covered objectives
    this._coveredObjectives.add(objectiveFunction);

    // Add the child objectives to the current objectives
    const childObjectives: ObjectiveFunction<T>[] = [];
    for (const objective of this._subject.getChildObjectives(
      objectiveFunction
    )) {
      if (
        !this._coveredObjectives.has(objective) &&
        !this._currentObjectives.has(objective)
      ) {
        ObjectiveManager.LOGGER.debug(
          `adding new objective: ${objective.getIdentifier()}`
        );

        this._currentObjectives.add(objective);
        childObjectives.push(objective);
      }
    }

    return childObjectives;
  }
}
