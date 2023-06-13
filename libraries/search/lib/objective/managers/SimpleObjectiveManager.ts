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

import TypedEmitter from "typed-emitter";

import { Encoding } from "../../Encoding";
import { SearchSubject } from "../../SearchSubject";
import { Events } from "../../util/Events";
import { ObjectiveFunction } from "../ObjectiveFunction";

import { ObjectiveManager } from "./ObjectiveManager";

/**
 * A simple objective manager that always evaluates an encoding on all objectives.
 *
 * @author Mitchell Olsthoorn
 */
export class SimpleObjectiveManager<
  T extends Encoding
> extends ObjectiveManager<T> {
  /**
   * @inheritDoc
   * @protected
   */
  protected _updateObjectives(objectiveFunction: ObjectiveFunction<T>): void {
    // Remove objective from the uncovered objectives
    this._uncoveredObjectives.delete(objectiveFunction);

    // Add objective to the covered objectives
    this._coveredObjectives.add(objectiveFunction);
  }

  /**
   * @inheritDoc
   */
  public load(subject: SearchSubject<T>): void {
    // Set the subject
    this._subject = subject;

    // TODO: Reset the objective manager
    const objectives = subject.getObjectives();

    for (const objective of objectives) {
      // Add all objectives to both the uncovered objectives and the current objectives
      this._uncoveredObjectives.add(objective);
      this._currentObjectives.add(objective);

      (<TypedEmitter<Events>>process).emit(
        "objectiveRegistered",
        this,
        subject,
        objective
      );
    }
  }
}
