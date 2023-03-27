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
import * as path from "node:path";

import { ControlFlowProgram } from "@syntest/cfg-core";

import { pathNotInRootPath } from "./diagnostics";
import { AbstractSyntaxTreeFactory } from "./factories/AbstractSyntaxTreeFactory";
import { ControlFlowGraphFactory } from "./factories/ControlFlowGraphFactory";
import { DependencyFactory } from "./factories/DependencyFactory";
import { SourceFactory } from "./factories/SourceFactory";
import { TargetFactory } from "./factories/TargetFactory";
import { SubTarget, Target } from "./Target";

export class RootContext<S> {
  protected _rootPath: string;

  protected sourceFactory: SourceFactory;
  protected abstractSyntaxTreeFactory: AbstractSyntaxTreeFactory<S>;
  protected controlFlowGraphFactory: ControlFlowGraphFactory<S>;
  protected targetFactory: TargetFactory<S>;
  protected dependencyFactory: DependencyFactory<S>;

  // Mapping: filepath -> source code
  protected _sources: Map<string, string>;

  // Mapping: filepath -> AST
  protected _abstractSyntaxTrees: Map<string, S>;

  // Mapping: filepath -> ControlFlowProgram
  protected _controlFlowProgramMap: Map<string, ControlFlowProgram<S>>;

  // Mapping: filepath -> target
  protected _targetMap: Map<string, Target>;

  // Mapping: filepath -> dependencies
  protected _dependenciesMap: Map<string, string[]>;

  constructor(
    rootPath: string,
    sourceFactory: SourceFactory,
    abstractSyntaxTreeFactory: AbstractSyntaxTreeFactory<S>,
    controlFlowGraphFactory: ControlFlowGraphFactory<S>,
    targetFactory: TargetFactory<S>,
    dependencyFactory: DependencyFactory<S>
  ) {
    this._rootPath = path.resolve(rootPath);

    this.sourceFactory = sourceFactory;
    this.abstractSyntaxTreeFactory = abstractSyntaxTreeFactory;
    this.controlFlowGraphFactory = controlFlowGraphFactory;
    this.targetFactory = targetFactory;
    this.dependencyFactory = dependencyFactory;

    this._sources = new Map();
    this._abstractSyntaxTrees = new Map();
    this._controlFlowProgramMap = new Map();
    this._targetMap = new Map();
    this._dependenciesMap = new Map();
  }

  protected resolvePath(filePath: string): string {
    const absolutePath = path.resolve(filePath);

    if (!this.verifyTargetPath(absolutePath)) {
      throw new Error(pathNotInRootPath(this._rootPath, absolutePath));
    }

    return absolutePath;
  }

  protected verifyTargetPath(filePath: string): boolean {
    return filePath.includes(this._rootPath);
  }

  /**
   * Loads the source code of the target
   * @param filePath
   */
  getSource(filePath: string): string {
    const absoluteTargetPath = this.resolvePath(filePath);

    // this takes up too much memory we should do some kind of garbage collection if we want to save it all
    if (!this._sources.has(absoluteTargetPath)) {
      this._sources.set(
        absoluteTargetPath,
        this.sourceFactory.produce(absoluteTargetPath)
      );
    }

    return this._sources.get(absoluteTargetPath);
  }

  /**
   * Loads the abstract syntax tree from the given filePath
   * @param filePath
   */
  getAbstractSyntaxTree(filePath: string): S {
    const absoluteTargetPath = this.resolvePath(filePath);

    // this takes up too much memory we should do some kind of garbage collection if we want to save it all
    if (!this._abstractSyntaxTrees.has(absoluteTargetPath)) {
      this._abstractSyntaxTrees.set(
        absoluteTargetPath,
        this.abstractSyntaxTreeFactory.convert(
          absoluteTargetPath,
          this.getSource(absoluteTargetPath)
        )
      );
    }

    return this._abstractSyntaxTrees.get(absoluteTargetPath);
  }

  /**
   * Loads the control flow program from the given filePath
   * @param filePath
   */
  getControlFlowProgram(filePath: string): ControlFlowProgram<S> {
    const absoluteTargetPath = path.resolve(filePath);

    if (!this._controlFlowProgramMap.has(absoluteTargetPath)) {
      this._controlFlowProgramMap.set(
        absoluteTargetPath,
        this.controlFlowGraphFactory.convert(
          absoluteTargetPath,
          this.getAbstractSyntaxTree(absoluteTargetPath)
        )
      );
    }

    return this._controlFlowProgramMap.get(absoluteTargetPath);
  }

  /**
   * Loads the target context from the given filePath
   * @param _filePath
   * @returns
   */
  getTarget(filePath: string): Target {
    const absolutePath = this.resolvePath(filePath);

    if (!this._targetMap.has(absolutePath)) {
      this._targetMap.set(
        absolutePath,
        this.targetFactory.extract(
          absolutePath,
          this.getAbstractSyntaxTree(absolutePath)
        )
      );
    }

    return this._targetMap.get(absolutePath);
  }

  /**
   * gets all sub-targets from the given filePath
   * @param filePath
   */
  getSubTargets(filePath: string): SubTarget[] {
    return this.getTarget(filePath).subTargets;
  }

  /**
   * Loads all dependencies from the given filePath
   * @param filePath
   */
  getDependencies(filePath: string): string[] {
    const absolutePath = this.resolvePath(filePath);

    if (!this._dependenciesMap.has(absolutePath)) {
      this._dependenciesMap.set(
        absolutePath,
        this.dependencyFactory.extract(
          absolutePath,
          this.getAbstractSyntaxTree(absolutePath)
        )
      );
    }

    return this._dependenciesMap.get(absolutePath);
  }

  get targets(): Map<string, Target> {
    return this._targetMap;
  }
}
