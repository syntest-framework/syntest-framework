/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { ObjectiveFunction } from "./objective/ObjectiveFunction";
import { Encoding } from "./Encoding";

import { CFG, Node } from "@syntest/cfg-core";

/**
 * Subject of the search process.
 *
 * @author Mitchell Olsthoorn
 */
export abstract class SearchSubject<T extends Encoding> {
  /**
   * Path to the subject.
   * @protected
   */
  private readonly _path: string;

  /**
   * Name of the subject.
   * @protected
   */
  protected readonly _name: string;

  /**
   * Control flow graph of the subject.
   * @protected
   */
  protected readonly _cfg: CFG;

  /**
   * Mapping of objectives to adjacent objectives
   * @protected
   */
  protected _objectives: Map<ObjectiveFunction<T>, ObjectiveFunction<T>[]>;

  /**
   *
   * @protected
   */
  protected _paths: any;

  /**
   * Constructor.
   *
   * @param name Name of the subject
   * @param cfg Control flow graph of the subject
   * @param functions Functions of the subject
   * @protected
   */
  protected constructor(path: string, name: string, cfg: CFG) {
    this._path = path;
    this._name = name;
    this._cfg = cfg;
    this._objectives = new Map<ObjectiveFunction<T>, ObjectiveFunction<T>[]>();
    this._extractObjectives();
  }

  /**
   * Extract objectives from the subject
   * @protected
   */
  protected abstract _extractObjectives(): void;

  /**
   * Retrieve objectives.
   */
  public getObjectives(): ObjectiveFunction<T>[] {
    return Array.from(this._objectives.keys());
  }

  /**
   * Retrieve child objectives.
   *
   * @param objective The objective to get the child objectives of
   */
  public getChildObjectives(
    objective: ObjectiveFunction<T>
  ): ObjectiveFunction<T>[] {
    return Array.from(this._objectives.get(objective));
  }

  get name(): string {
    return this._name;
  }

  get cfg(): CFG {
    return this._cfg;
  }

  get path(): string {
    return this._path;
  }
}
