/*
 * Copyright 2020-2021 SynTest contributors
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

import { Encoding } from "../Encoding";
import { SearchSubject } from "../SearchSubject";

import { ObjectiveFunction } from "./ObjectiveFunction";

/**
 * Objective function for the function branch criterion.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class FunctionObjectiveFunction<
  T extends Encoding
> extends ObjectiveFunction<T> {
  constructor(subject: SearchSubject<T>, id: string) {
    super(id, subject);
  }

  /**
   * @inheritDoc
   */
  calculateDistance(encoding: T): number {
    if (encoding.getExecutionResult() === undefined) {
      return Number.MAX_VALUE;
    }

    return encoding.getExecutionResult().coversId(this._id) ? 0 : 1;
  }
}
