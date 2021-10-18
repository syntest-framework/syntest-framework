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

import { TerminationTrigger } from "./TerminationTrigger";

/**
 * Manager for the termination triggers of the search process.
 *
 * Keeps track if any of the termination triggers have been triggered.
 *
 * @author Mitchell Olsthoorn
 */
export class TerminationManager implements TerminationTrigger {
  /**
   * List of currently active termination triggers.
   * @protected
   */
  protected _terminationTriggers: TerminationTrigger[];

  constructor() {
    this._terminationTriggers = [];
  }

  /**
   * @inheritDoc
   */
  isTriggered(): boolean {
    return !this._terminationTriggers.every(
      (trigger) => !trigger.isTriggered()
    );
  }

  /**
   * Add trigger to the list of active termination triggers.
   *
   * @param trigger The trigger to add
   */
  public addTrigger(trigger: TerminationTrigger): TerminationManager {
    this._terminationTriggers.push(trigger);
    return this;
  }

  /**
   * Remove trigger from the list of active termination triggers.
   *
   * @param trigger The trigger to remove
   */
  public removeTrigger(trigger: TerminationTrigger): TerminationManager {
    this._terminationTriggers.slice(
      this._terminationTriggers.indexOf(trigger),
      1
    );
    return this;
  }
}
