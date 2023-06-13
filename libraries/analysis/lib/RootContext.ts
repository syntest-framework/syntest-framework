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

import { ControlFlowProgram } from "@syntest/cfg";
import TypedEmitter from "typed-emitter";

import { AbstractSyntaxTreeFactory } from "./factories/AbstractSyntaxTreeFactory";
import { ControlFlowGraphFactory } from "./factories/ControlFlowGraphFactory";
import { DependencyFactory } from "./factories/DependencyFactory";
import { SourceFactory } from "./factories/SourceFactory";
import { TargetFactory } from "./factories/TargetFactory";
import { SubTarget, Target } from "./Target";
import { pathNotInRootPath } from "./util/diagnostics";
import { Events } from "./util/Events";

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
  protected _controlFlowProgramMap: Map<string, ControlFlowProgram>;

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
    const absolutePath = this.resolvePath(filePath);

    // this takes up too much memory we should do some kind of garbage collection if we want to save it all
    if (!this._sources.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "sourceResolvingStart",
        this,
        absolutePath
      );
      this._sources.set(absolutePath, this.sourceFactory.produce(absolutePath));
      (<TypedEmitter<Events>>process).emit(
        "sourceResolvingComplete",
        this,
        absolutePath,
        this._sources.get(absolutePath)
      );
    }

    return this._sources.get(absolutePath);
  }

  /**
   * Loads the abstract syntax tree from the given filePath
   * @param filePath
   */
  getAbstractSyntaxTree(filePath: string): S {
    const absolutePath = this.resolvePath(filePath);

    // this takes up too much memory we should do some kind of garbage collection if we want to save it all
    if (!this._abstractSyntaxTrees.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "abstractSyntaxTreeResolvingStart",
        this,
        absolutePath
      );
      this._abstractSyntaxTrees.set(
        absolutePath,
        this.abstractSyntaxTreeFactory.convert(
          absolutePath,
          this.getSource(absolutePath)
        )
      );
      (<TypedEmitter<Events>>process).emit(
        "abstractSyntaxTreeResolvingComplete",
        this,
        absolutePath,
        this._abstractSyntaxTrees.get(absolutePath)
      );
    }

    return this._abstractSyntaxTrees.get(absolutePath);
  }

  /**
   * Loads the control flow program from the given filePath
   * @param filePath
   */
  getControlFlowProgram(filePath: string): ControlFlowProgram {
    const absolutePath = path.resolve(filePath);

    if (!this._controlFlowProgramMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "controlFlowGraphResolvingStart",
        this,
        absolutePath
      );
      this._controlFlowProgramMap.set(
        absolutePath,
        this.controlFlowGraphFactory.convert(
          absolutePath,
          this.getAbstractSyntaxTree(absolutePath)
        )
      );
      (<TypedEmitter<Events>>process).emit(
        "controlFlowGraphResolvingComplete",
        this,
        absolutePath,
        this._controlFlowProgramMap.get(absolutePath)
      );
    }

    return this._controlFlowProgramMap.get(absolutePath);
  }

  /**
   * Loads the target context from the given filePath
   * @param _filePath
   * @returns
   */
  getTarget(filePath: string): Target {
    const absolutePath = this.resolvePath(filePath);

    if (!this._targetMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "targetExtractionStart",
        this,
        absolutePath
      );
      this._targetMap.set(
        absolutePath,
        this.targetFactory.extract(
          absolutePath,
          this.getAbstractSyntaxTree(absolutePath)
        )
      );
      (<TypedEmitter<Events>>process).emit(
        "targetExtractionComplete",
        this,
        absolutePath,
        this._targetMap.get(absolutePath)
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
      (<TypedEmitter<Events>>process).emit(
        "dependencyResolvingStart",
        this,
        absolutePath
      );
      this._dependenciesMap.set(
        absolutePath,
        this.dependencyFactory.extract(
          absolutePath,
          this.getAbstractSyntaxTree(absolutePath)
        )
      );
      (<TypedEmitter<Events>>process).emit(
        "dependencyResolvingComplete",
        this,
        absolutePath,
        this._dependenciesMap.get(absolutePath)
      );
    }

    return this._dependenciesMap.get(absolutePath);
  }
}
