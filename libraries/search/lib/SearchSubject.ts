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
/* eslint-disable @typescript-eslint/no-explicit-any */

import { RootContext, Target } from "@syntest/analysis";
import { ControlFlowProgram } from "@syntest/cfg";

import { Encoding } from "./Encoding";
import { ObjectiveFunction } from "./objective/ObjectiveFunction";

/**
 * Subject of the search process.
 *
 * @author Mitchell Olsthoorn
 */
export abstract class SearchSubject<T extends Encoding> {
  /**
   * Subject Target
   * @protected
   */
  protected readonly _target: Target;

  /**
   * The root context.
   * @protected
   */
  protected readonly _rootContext: RootContext<unknown>;

  /**
   * Mapping of objectives to adjacent objectives
   * @protected
   */
  protected _objectives: Map<ObjectiveFunction<T>, ObjectiveFunction<T>[]>;

  /**
   * Constructor.
   *
   * @param target Target of the subject
   * @param rootContext RootContext of the subject
   * @protected
   */
  protected constructor(target: Target, rootContext: RootContext<unknown>) {
    this._target = target;
    this._rootContext = rootContext;
    this._objectives = new Map<ObjectiveFunction<T>, ObjectiveFunction<T>[]>();
    this._extractObjectives();
  }

  /**
   * Extract objectives from the subject based on the targets.
   * @protected
   */
  protected abstract _extractObjectives(): void;

  /**
   * Retrieve objectives.
   */
  public getObjectives(): ObjectiveFunction<T>[] {
    return [...this._objectives.keys()];
  }

  /**
   * Retrieve child objectives.
   *
   * @param objective The objective to get the child objectives of
   */
  public getChildObjectives(
    objective: ObjectiveFunction<T>
  ): ObjectiveFunction<T>[] {
    return [...this._objectives.get(objective)];
  }

  get name(): string {
    return this._target.name;
  }

  get cfg(): ControlFlowProgram {
    return this._rootContext.getControlFlowProgram(this.path);
  }

  get path(): string {
    return this._target.path;
  }
}
