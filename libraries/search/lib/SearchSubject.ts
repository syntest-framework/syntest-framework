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

import { Target } from "@syntest/analysis";

import { Encoding } from "./Encoding";
import { ObjectiveFunction } from "./objective/ObjectiveFunction";

/**
 * Subject of the search process.
 */
export abstract class SearchSubject<T extends Encoding> {
  /**
   * Subject Target
   * @protected
   */
  protected readonly _target: Target;

  /**
   * Mapping of objectives to adjacent objectives
   * @protected
   */
  protected _objectives: ObjectiveFunction<T>[];

  /**
   * Constructor.
   *
   * @param target Target of the subject
   * @param rootContext RootContext of the subject
   * @protected
   */
  protected constructor(target: Target, objectives: ObjectiveFunction<T>[]) {
    this._target = target;
    this._objectives = objectives;
  }

  get name(): string {
    return this._target.name;
  }

  get path(): string {
    return this._target.path;
  }

  /**
   * Gets the objectives
   */
  get objectives(): ObjectiveFunction<T>[] {
    return [...this._objectives];
  }
}
