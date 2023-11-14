/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
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

import { existsSync, lstatSync } from "node:fs";

import * as t from "@babel/types";
import { RootContext as FrameworkRootContext } from "@syntest/analysis";
import {
  failure,
  IllegalArgumentError,
  isFailure,
  Result,
  success,
  unwrap,
} from "@syntest/diagnostics";
import { getLogger, Logger } from "@syntest/logging";
import TypedEmitter from "typed-emitter";

import { AbstractSyntaxTreeFactory } from "./ast/AbstractSyntaxTreeFactory";
import { ControlFlowGraphFactory } from "./cfg/ControlFlowGraphFactory";
import { ConstantPool } from "./constant/ConstantPool";
import { ConstantPoolFactory } from "./constant/ConstantPoolFactory";
import { ConstantPoolManager } from "./constant/ConstantPoolManager";
import { DependencyFactory } from "./dependency/DependencyFactory";
import { Events } from "./Events";
import { Export } from "./target/export/Export";
import { ExportFactory } from "./target/export/ExportFactory";
import { TargetFactory } from "./target/TargetFactory";
import { Element } from "./type/discovery/element/Element";
import { DiscoveredObjectType } from "./type/discovery/object/DiscoveredType";
import { Relation } from "./type/discovery/relation/Relation";
import { TypeExtractor } from "./type/discovery/TypeExtractor";
import { TypeModel } from "./type/resolving/TypeModel";
import { TypeModelFactory } from "./type/resolving/TypeModelFactory";
import { TypePool } from "./type/resolving/TypePool";
import { readFile } from "./utils/fileSystem";

export class RootContext extends FrameworkRootContext<t.Node> {
  protected static LOGGER: Logger;

  protected _exportFactory: ExportFactory;
  protected _typeExtractor: TypeExtractor;
  protected _typeResolver: TypeModelFactory;

  protected _constantPoolFactory: ConstantPoolFactory;

  protected _targetFiles: Set<string>;
  protected _analysisFiles: Set<string>;

  // filepath -> id -> element
  protected _elementMap: Map<string, Map<string, Element>>;
  // filepath -> id -> relation
  protected _relationMap: Map<string, Map<string, Relation>>;
  // filepath -> id -> object
  protected _objectMap: Map<string, Map<string, DiscoveredObjectType>>;

  protected _typeModel: TypeModel;
  protected _typePool: TypePool;

  // Mapping: filepath -> target name -> Exports
  protected _exportMap: Map<string, Export[]>;

  constructor(
    rootPath: string,
    targetFiles: Set<string>,
    analysisFiles: Set<string>,
    abstractSyntaxTreeFactory: AbstractSyntaxTreeFactory,
    controlFlowGraphFactory: ControlFlowGraphFactory,
    targetFactory: TargetFactory,
    dependencyFactory: DependencyFactory,
    exportFactory: ExportFactory,
    typeExtractor: TypeExtractor,
    typeResolver: TypeModelFactory,
    constantPoolFactory: ConstantPoolFactory
  ) {
    super(
      rootPath,
      undefined,
      abstractSyntaxTreeFactory,
      controlFlowGraphFactory,
      targetFactory,
      dependencyFactory
    );
    RootContext.LOGGER = getLogger(RootContext.name);
    this._targetFiles = targetFiles;
    this._analysisFiles = analysisFiles;
    this._exportFactory = exportFactory;
    this._typeExtractor = typeExtractor;
    this._typeResolver = typeResolver;
    this._constantPoolFactory = constantPoolFactory;
  }

  get rootPath(): string {
    return this._rootPath;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  override getSource(filepath: string): Result<string> {
    const result = this.resolvePath(filepath);

    if (isFailure(result)) return result;

    let absolutePath = unwrap(result);

    if (!this._sources.has(absolutePath)) {
      if (!existsSync(absolutePath)) {
        if (existsSync(absolutePath + ".js")) {
          absolutePath += ".js";
        } else if (existsSync(absolutePath + ".ts")) {
          absolutePath += ".ts";
        } else {
          return failure(
            new IllegalArgumentError("Cannot find source", {
              context: { filepath: filepath },
            })
          );
        }
      }

      const stats = lstatSync(absolutePath);

      if (stats.isDirectory()) {
        if (existsSync(absolutePath + "/index.js")) {
          absolutePath += "/index.js";
        } else if (existsSync(absolutePath + "/index.ts")) {
          absolutePath += "/index.ts";
        } else {
          return failure(
            new IllegalArgumentError("Cannot find source", {
              context: { filepath: filepath },
            })
          );
        }
      }

      this._sources.set(absolutePath, readFile(absolutePath));
    }

    return success(this._sources.get(absolutePath));
  }

  getExports(filepath: string): Result<Export[]> {
    const result = this.resolvePath(filepath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    if (!this._exportMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "exportExtractionStart",
        this,
        absolutePath
      );
      const result = this.getAbstractSyntaxTree(absolutePath);

      if (isFailure(result)) return result;

      const exportResult = this._exportFactory.extract(
        absolutePath,
        unwrap(result)
      );

      if (isFailure(exportResult)) return exportResult;

      this._exportMap.set(absolutePath, unwrap(exportResult));
      (<TypedEmitter<Events>>process).emit(
        "exportExtractionComplete",
        this,
        absolutePath
      );
    }

    return success(this._exportMap.get(absolutePath));
  }

  getAllExports(): Map<string, Export[]> {
    if (!this._exportMap) {
      this._exportMap = new Map();

      for (const filepath of this._analysisFiles) {
        const result = this.getExports(filepath);

        if (isFailure(result)) RootContext.LOGGER.warn(result.error.message);
      }
    }
    return this._exportMap;
  }

  getElements(filepath: string): Result<Map<string, Element>> {
    const result = this.resolvePath(filepath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    if (!this._elementMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "elementExtractionStart",
        this,
        absolutePath
      );
      const result = this.getAbstractSyntaxTree(absolutePath);

      if (isFailure(result)) return result;

      const elementsResult = this._typeExtractor.extractElements(
        absolutePath,
        unwrap(result)
      );

      if (isFailure(elementsResult)) return elementsResult;

      this._elementMap.set(absolutePath, unwrap(elementsResult));
      (<TypedEmitter<Events>>process).emit(
        "elementExtractionComplete",
        this,
        absolutePath
      );
    }

    return success(this._elementMap.get(absolutePath));
  }

  getAllElements() {
    if (!this._elementMap) {
      this._elementMap = new Map();

      for (const filepath of this._analysisFiles) {
        const result = this.getElements(filepath);

        if (isFailure(result)) RootContext.LOGGER.warn(result.error.message);
      }
    }
    return this._elementMap;
  }

  getRelations(filepath: string): Result<Map<string, Relation>> {
    const result = this.resolvePath(filepath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    if (!this._relationMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "relationExtractionStart",
        this,
        absolutePath
      );

      const result = this.getAbstractSyntaxTree(absolutePath);

      if (isFailure(result)) return result;

      const relationsResult = this._typeExtractor.extractRelations(
        absolutePath,
        unwrap(result)
      );

      if (isFailure(relationsResult)) return relationsResult;

      this._relationMap.set(absolutePath, unwrap(relationsResult));
      (<TypedEmitter<Events>>process).emit(
        "relationExtractionComplete",
        this,
        absolutePath
      );
    }

    return success(this._relationMap.get(absolutePath));
  }

  getAllRelations() {
    if (!this._relationMap) {
      this._relationMap = new Map();

      for (const filepath of this._analysisFiles) {
        const result = this.getRelations(filepath);

        if (isFailure(result)) RootContext.LOGGER.warn(result.error.message);
      }
    }
    return this._relationMap;
  }

  getObjectTypes(filepath: string): Result<Map<string, DiscoveredObjectType>> {
    const result = this.resolvePath(filepath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    if (!this._objectMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "objectTypeExtractionStart",
        this,
        absolutePath
      );

      const result = this.getAbstractSyntaxTree(absolutePath);

      if (isFailure(result)) return result;

      const objectsResult = this._typeExtractor.extractObjectTypes(
        absolutePath,
        unwrap(result)
      );

      if (isFailure(objectsResult)) return objectsResult;

      this._objectMap.set(absolutePath, unwrap(objectsResult));
      (<TypedEmitter<Events>>process).emit(
        "objectTypeExtractionComplete",
        this,
        absolutePath
      );
    }

    return success(this._objectMap.get(absolutePath));
  }

  getAllObjectTypes() {
    if (!this._objectMap) {
      this._objectMap = new Map();

      for (const filepath of this._analysisFiles) {
        const result = this.getObjectTypes(filepath);

        if (isFailure(result)) RootContext.LOGGER.warn(result.error.message);
      }
    }
    return this._objectMap;
  }

  resolveTypes(): void {
    // TODO allow sub selections of files (do not consider entire context)
    if (!this._elementMap) {
      this.getAllElements();
    }
    if (!this._relationMap) {
      this.getAllRelations();
    }
    if (!this._objectMap) {
      this.getAllObjectTypes();
    }
    if (!this._exportMap) {
      this.getAllExports();
    }

    if (!this._typeModel) {
      (<TypedEmitter<Events>>process).emit("typeResolvingStart", this);
      this._typeModel = this._typeResolver.resolveTypes(
        this._elementMap,
        this._relationMap
      );
      this._typePool = new TypePool(this._objectMap, this._exportMap);
      (<TypedEmitter<Events>>process).emit("typeResolvingComplete", this);
    }
  }

  getTypeModel(): TypeModel {
    if (!this._typeModel) {
      this.resolveTypes();
    }

    return this._typeModel;
  }

  getTypePool(): TypePool {
    if (!this._typePool) {
      this.resolveTypes();
    }

    return this._typePool;
  }

  // TODO cache
  private _getContextConstantPool(): Result<ConstantPool> {
    const constantPool = new ConstantPool();
    for (const filepath of this._analysisFiles) {
      const result = this.getAbstractSyntaxTree(filepath);

      if (isFailure(result)) return result;

      this._constantPoolFactory.extract(filepath, unwrap(result), constantPool);
    }

    return success(constantPool);
  }

  // TODO cache
  getConstantPoolManager(filepath: string): Result<ConstantPoolManager> {
    const result = this.resolvePath(filepath);

    if (isFailure(result)) return result;

    const absolutePath = unwrap(result);

    RootContext.LOGGER.info("Extracting constants");
    const astResult = this.getAbstractSyntaxTree(filepath);

    if (isFailure(astResult)) return astResult;

    const targetConstantPool = this._constantPoolFactory.extract(
      absolutePath,
      unwrap(astResult)
    );
    const contextConstantPoolResult = this._getContextConstantPool();

    if (isFailure(contextConstantPoolResult)) return contextConstantPoolResult;

    const dynamicConstantPool = new ConstantPool();

    const constantPoolManager = new ConstantPoolManager(
      targetConstantPool,
      unwrap(contextConstantPoolResult),
      dynamicConstantPool
    );

    RootContext.LOGGER.info("Extracting constants done");
    return success(constantPoolManager);
  }
}
