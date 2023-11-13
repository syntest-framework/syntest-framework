/*
 * Copyright 2020-2023 SynTest contributors
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
import * as path from "node:path";

import { ControlFlowProgram } from "@syntest/cfg";
import {
  failure,
  IOError,
  isFailure,
  Result,
  success,
  unwrap,
} from "@syntest/diagnostics";
import TypedEmitter from "typed-emitter";

import { Events } from "./Events";
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

  protected resolvePath(filePath: string): Result<string> {
    const absolutePath = path.resolve(filePath);

    if (!this.verifyTargetPath(absolutePath)) {
      return failure(
        new IOError("The given filepath is not in the given root path", {
          context: { rootPath: this._rootPath, filePath: filePath },
        })
      );
    }

    return success(absolutePath);
  }

  protected verifyTargetPath(filePath: string): boolean {
    return filePath.includes(this._rootPath);
  }

  /**
   * Loads the source code of the target
   * @param filePath
   */
  getSource(filePath: string): Result<string> {
    const result = this.resolvePath(filePath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    // this takes up too much memory we should do some kind of garbage collection if we want to save it all
    if (!this._sources.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "sourceResolvingStart",
        this,
        absolutePath
      );
      const result = this.sourceFactory.produce(absolutePath);

      if (isFailure(result)) return result;

      this._sources.set(absolutePath, unwrap(result));
      (<TypedEmitter<Events>>process).emit(
        "sourceResolvingComplete",
        this,
        absolutePath,
        this._sources.get(absolutePath)
      );
    }

    return success(this._sources.get(absolutePath));
  }

  /**
   * Loads the abstract syntax tree from the given filePath
   * @param filePath
   */
  getAbstractSyntaxTree(filePath: string): Result<S> {
    const result = this.resolvePath(filePath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    // this takes up too much memory we should do some kind of garbage collection if we want to save it all
    if (!this._abstractSyntaxTrees.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "abstractSyntaxTreeResolvingStart",
        this,
        absolutePath
      );

      const result = this.getSource(absolutePath);

      if (isFailure(result)) return result;

      this._abstractSyntaxTrees.set(
        absolutePath,
        this.abstractSyntaxTreeFactory.convert(absolutePath, unwrap(result))
      );
      (<TypedEmitter<Events>>process).emit(
        "abstractSyntaxTreeResolvingComplete",
        this,
        absolutePath,
        this._abstractSyntaxTrees.get(absolutePath)
      );
    }

    return success(this._abstractSyntaxTrees.get(absolutePath));
  }

  /**
   * Loads the control flow program from the given filePath
   * @param filePath
   */
  getControlFlowProgram(filePath: string): Result<ControlFlowProgram> {
    const result = this.resolvePath(filePath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    if (!this._controlFlowProgramMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "controlFlowGraphResolvingStart",
        this,
        absolutePath
      );

      const result = this.getAbstractSyntaxTree(absolutePath);

      if (isFailure(result)) return result;

      this._controlFlowProgramMap.set(
        absolutePath,
        this.controlFlowGraphFactory.convert(absolutePath, unwrap(result))
      );
      (<TypedEmitter<Events>>process).emit(
        "controlFlowGraphResolvingComplete",
        this,
        absolutePath,
        this._controlFlowProgramMap.get(absolutePath)
      );
    }

    return success(this._controlFlowProgramMap.get(absolutePath));
  }

  /**
   * Loads the target context from the given filePath
   * @param _filePath
   * @returns
   */
  getTarget(filePath: string): Result<Target> {
    const result = this.resolvePath(filePath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    if (!this._targetMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "targetExtractionStart",
        this,
        absolutePath
      );

      const result = this.getAbstractSyntaxTree(absolutePath);

      if (isFailure(result)) return result;

      this._targetMap.set(
        absolutePath,
        this.targetFactory.extract(absolutePath, unwrap(result))
      );
      (<TypedEmitter<Events>>process).emit(
        "targetExtractionComplete",
        this,
        absolutePath,
        this._targetMap.get(absolutePath)
      );
    }

    return success(this._targetMap.get(absolutePath));
  }

  /**
   * gets all sub-targets from the given filePath
   * @param filePath
   */
  getSubTargets(filePath: string): Result<SubTarget[]> {
    const result = this.getTarget(filePath);

    if (isFailure(result)) return result;

    return success(unwrap(result).subTargets);
  }

  /**
   * Loads all dependencies from the given filePath
   * @param filePath
   */
  getDependencies(filePath: string): Result<string[]> {
    const result = this.resolvePath(filePath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    if (!this._dependenciesMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "dependencyResolvingStart",
        this,
        absolutePath
      );
      const result = this.getAbstractSyntaxTree(absolutePath);

      if (isFailure(result)) return result;

      this._dependenciesMap.set(
        absolutePath,
        this.dependencyFactory.extract(absolutePath, unwrap(result))
      );
      (<TypedEmitter<Events>>process).emit(
        "dependencyResolvingComplete",
        this,
        absolutePath,
        this._dependenciesMap.get(absolutePath)
      );
    }

    return success(this._dependenciesMap.get(absolutePath));
  }
}
