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

const caches: { [key: string]: Map<string, any> } = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

export function cache(cacheName: string) {
  const cache = new Map<string, Result<any>>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  caches[cacheName] = cache;
  return function (
    _: RootContext<unknown>,
    __: string,
    descriptor: TypedPropertyDescriptor<(filePath: string) => Result<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    const method = descriptor.value;
    descriptor.value = function (filePath: string) {
      const key = filePath;

      if (caches[cacheName].has(key)) {
        return <Result<any>>caches[cacheName].get(key); // eslint-disable-line @typescript-eslint/no-explicit-any
      }

      const result = Reflect.apply(method, this, [filePath]);

      caches[cacheName].set(key, result);

      return result;
    };
  };
}

export function resolvePath() {
  return function (
    _: RootContext<unknown>,
    __: string,
    descriptor: TypedPropertyDescriptor<(filePath: string) => Result<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    const method = descriptor.value;
    descriptor.value = function (filePath: string) {
      const result = (<RootContext<unknown>>this).resolvePath(filePath);

      if (isFailure(result)) return result;

      const absolutePath = unwrap(result);

      return Reflect.apply(method, this, [absolutePath]);
    };
  };
}

export class RootContext<S> {
  protected _rootPath: string;

  protected sourceFactory: SourceFactory;
  protected abstractSyntaxTreeFactory: AbstractSyntaxTreeFactory<S>;
  protected controlFlowGraphFactory: ControlFlowGraphFactory<S>;
  protected targetFactory: TargetFactory<S>;
  protected dependencyFactory: DependencyFactory<S>;

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
  }

  resolvePath(filePath: string): Result<string> {
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
  @cache("source")
  @resolvePath()
  getSource(filePath: string): Result<string> {
    const sourceResult = this.sourceFactory.produce(filePath);

    if (isFailure(sourceResult)) return sourceResult;

    (<TypedEmitter<Events>>process).emit(
      "sourceResolvingComplete",
      this,
      filePath,
      unwrap(sourceResult)
    );

    return sourceResult;
  }

  /**
   * Loads the abstract syntax tree from the given filePath
   * @param filePath
   */
  @cache("ast")
  @resolvePath()
  getAbstractSyntaxTree(filePath: string): Result<S> {
    (<TypedEmitter<Events>>process).emit(
      "abstractSyntaxTreeResolvingStart",
      this,
      filePath
    );

    const sourceResult = this.getSource(filePath);

    if (isFailure(sourceResult)) return sourceResult;

    const astResult = this.abstractSyntaxTreeFactory.convert(
      filePath,
      unwrap(sourceResult)
    );

    if (isFailure(astResult)) return astResult;

    (<TypedEmitter<Events>>process).emit(
      "abstractSyntaxTreeResolvingComplete",
      this,
      filePath,
      unwrap(astResult)
    );

    return astResult;
  }

  /**
   * Loads the control flow program from the given filePath
   * @param filePath
   */
  @cache("cfp")
  @resolvePath()
  getControlFlowProgram(filePath: string): Result<ControlFlowProgram> {
    (<TypedEmitter<Events>>process).emit(
      "controlFlowGraphResolvingStart",
      this,
      filePath
    );

    const astResult = this.getAbstractSyntaxTree(filePath);

    if (isFailure(astResult)) return astResult;

    const cfgResult = this.controlFlowGraphFactory.convert(
      filePath,
      unwrap(astResult)
    );

    if (isFailure(cfgResult)) return cfgResult;

    (<TypedEmitter<Events>>process).emit(
      "controlFlowGraphResolvingComplete",
      this,
      filePath,
      unwrap(cfgResult)
    );

    return cfgResult;
  }

  /**
   * Loads the target context from the given filePath
   * @param _filePath
   * @returns
   */
  @cache("target")
  @resolvePath()
  getTarget(filePath: string): Result<Target> {
    (<TypedEmitter<Events>>process).emit(
      "targetExtractionStart",
      this,
      filePath
    );

    const astResult = this.getAbstractSyntaxTree(filePath);

    if (isFailure(astResult)) return astResult;

    const targetResult = this.targetFactory.extract(
      filePath,
      unwrap(astResult)
    );

    if (isFailure(targetResult)) return targetResult;

    (<TypedEmitter<Events>>process).emit(
      "targetExtractionComplete",
      this,
      filePath,
      unwrap(targetResult)
    );

    return targetResult;
  }

  /**
   * Loads all dependencies from the given filePath
   * @param filePath
   */
  @cache("dependencies")
  @resolvePath()
  getDependencies(filePath: string): Result<string[]> {
    (<TypedEmitter<Events>>process).emit(
      "dependencyResolvingStart",
      this,
      filePath
    );
    const astResult = this.getAbstractSyntaxTree(filePath);

    if (isFailure(astResult)) return astResult;

    const dependencyResult = this.dependencyFactory.extract(
      filePath,
      unwrap(astResult)
    );

    if (isFailure(dependencyResult)) return dependencyResult;

    (<TypedEmitter<Events>>process).emit(
      "dependencyResolvingComplete",
      this,
      filePath,
      unwrap(dependencyResult)
    );

    return dependencyResult;
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
}
