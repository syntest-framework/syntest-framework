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

import { Encoding } from "../Encoding";

import { ObjectiveFunction } from "./ObjectiveFunction";

/**
 * Objective function for the exception criterion.
 *
 * This objective function should not be added manually to the objective manager.
 * It is added dynamically when an exception occurs on runtime.
 */
export class ExceptionObjectiveFunction<
  T extends Encoding
> extends ObjectiveFunction<T> {
  protected _error: Error;

  constructor(id: string, error: Error) {
    super(id);
    this._error = error;
  }

  get error() {
    return this._error;
  }

  override calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();

    if (
      executionResult === undefined ||
      executionResult.getTraces().length === 0
    ) {
      return Number.MAX_VALUE;
    }

    return executionResult.coversId(this._id) ? 0 : Number.MAX_VALUE;
  }
}
