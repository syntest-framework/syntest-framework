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

import { Encoding } from "../../Encoding";
import { SearchSubject } from "../../SearchSubject";
import { ObjectiveFunction } from "../objectiveFunctions/ObjectiveFunction";

import { ArchiveBasedObjectiveManager } from "./ArchiveBasedObjectiveManager";

/**
 * An objective manager that only tracks if an objective is covered
 * but doesn't provide any guidance.
 */
export class TrackingObjectiveManager<
  T extends Encoding
> extends ArchiveBasedObjectiveManager<T> {
  /**
   * @inheritDoc
   * @protected
   */
  protected _updateObjectives(
    objectiveFunction: ObjectiveFunction<T>
  ): ObjectiveFunction<T>[] {
    // Remove objective from the uncovered objectives
    this._uncoveredObjectives.delete(objectiveFunction);

    // Add objective to the covered objectives
    this._coveredObjectives.add(objectiveFunction);

    return [];
  }

  /**
   * @inheritDoc
   */
  public load(subject: SearchSubject<T>): void {
    // Set the subject
    this._subject = subject;

    // Reset the objective manager
    this._reset();

    // Add all objectives to both the uncovered objectives and the current objectives
    const objectives = subject.objectives;
    for (const objective of objectives) {
      // If the objective is a control flow based objective, set the shallow flag
      objective.shallow = true;

      this._uncoveredObjectives.add(objective);
      this._currentObjectives.add(objective);
    }
  }
}
