/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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
import { SubTarget, Target } from "./Target";
import { ControlFlowProgram } from "@syntest/cfg-core";
import * as path from "path";
import { ActionDescription } from "./ActionDescription";
import { pathNotInRootPath } from "../../util/diagnostics";

export abstract class RootContext {
  protected _rootPath: string;

  // Mapping: filepath -> source code
  protected _targetMap: Map<string, Target>;
  // Mapping: filepath -> source code
  protected _sources: Map<string, string>;

  constructor(rootPath: string) {
    this._rootPath = path.resolve(rootPath);
    this._targetMap = new Map();
    this._sources = new Map();
  }

  protected resolvePath(_path: string): string {
    const absolutePath = path.resolve(_path);

    if (!this.verifyTargetPath(absolutePath)) {
      throw new Error(pathNotInRootPath(this._rootPath, absolutePath));
    }

    return absolutePath;
  }

  protected verifyTargetPath(_path: string): boolean {
    return _path.includes(this._rootPath);
  }

  /**
   * Loads the source code of the target
   * @param path
   */
  abstract getSource(path: string): string;

  /**
   * Loads the abstract syntax tree from the given path
   * @param path
   */
  abstract getAbstractSyntaxTree<S>(path: string): S;

  /**
   * Loads the control flow program from the given path
   * @param path
   */
  abstract getControlFlowProgram<S>(path: string): ControlFlowProgram<S>;

  /**
   * Loads all sub-targets from the given path
   * @param path
   */
  abstract getSubTargets(path: string): SubTarget[];

  /**
   * Loads all dependencies from the given path
   * @param path
   */
  abstract getDependencies(path: string): string[];

  /**
   * Loads the target context from the given path
   * @param _path
   * @returns
   */
  getTarget(_path: string): Target {
    _path = this.resolvePath(_path);
    const name = path.basename(_path);

    if (!this._targetMap.has(_path)) {
      const targets = this.getSubTargets(_path);
      this._targetMap.set(_path, {
        path: _path,
        name: name,
        subTargets: targets,
      });
    }

    return this._targetMap.get(_path);
  }

  /**
   * Loads a specific action description from the given path and name
   * @param path
   * @param id
   */
  abstract getActionDescriptionMap<A extends ActionDescription>(
    path: string,
    id: string
  ): Map<string, A>;

  /**
   * Loads all action descriptions from the given path
   * @param path
   */
  abstract getActionDescriptionMaps<A extends ActionDescription>(
    path: string
  ): Map<string, Map<string, A>>;

  get targets(): Map<string, Target> {
    return this._targetMap;
  }
}
