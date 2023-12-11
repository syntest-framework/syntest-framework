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
import {
  cache,
  RootContext as FrameworkRootContext,
  resolvePath,
} from "@syntest/analysis";
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

  // filePath -> id -> element
  protected _elementMap: Map<string, Map<string, Element>>;
  // filePath -> id -> relation
  protected _relationMap: Map<string, Map<string, Relation>>;
  // filePath -> id -> object
  protected _objectMap: Map<string, Map<string, DiscoveredObjectType>>;

  protected _typeModel: TypeModel;
  protected _typePool: TypePool;

  // Mapping: filePath -> target name -> Exports
  protected _exportMap: Map<string, Export[]>;

  get targetFiles() {
    return this._targetFiles;
  }

  get analysisFiles() {
    return this._analysisFiles;
  }

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
  @cache("source")
  @resolvePath()
  override getSource(filePath: string): Result<string> {
    if (!existsSync(filePath)) {
      if (existsSync(filePath + ".js")) {
        filePath += ".js";
      } else if (existsSync(filePath + ".ts")) {
        filePath += ".ts";
      } else {
        return failure(
          new IllegalArgumentError("Cannot find source", {
            context: { filePath: filePath },
          })
        );
      }
    }

    const stats = lstatSync(filePath);

    if (stats.isDirectory()) {
      if (existsSync(filePath + "/index.js")) {
        filePath += "/index.js";
      } else if (existsSync(filePath + "/index.ts")) {
        filePath += "/index.ts";
      } else {
        return failure(
          new IllegalArgumentError("Cannot find source", {
            context: { filePath: filePath },
          })
        );
      }
    }

    return success(readFile(filePath));
  }

  @cache("exports")
  @resolvePath()
  getExports(filePath: string): Result<Export[]> {
    (<TypedEmitter<Events>>process).emit(
      "exportExtractionStart",
      this,
      filePath
    );
    const astResult = this.getAbstractSyntaxTree(filePath);

    if (isFailure(astResult)) return astResult;

    const exportResult = this._exportFactory.extract(
      filePath,
      unwrap(astResult)
    );

    if (isFailure(exportResult)) return exportResult;

    (<TypedEmitter<Events>>process).emit(
      "exportExtractionComplete",
      this,
      filePath,
      unwrap(exportResult)
    );

    return exportResult;
  }

  @cache("elements")
  @resolvePath()
  getElements(filePath: string): Result<Map<string, Element>> {
    (<TypedEmitter<Events>>process).emit(
      "elementExtractionStart",
      this,
      filePath
    );
    const astResult = this.getAbstractSyntaxTree(filePath);

    if (isFailure(astResult)) return astResult;

    const elementsResult = this._typeExtractor.extractElements(
      filePath,
      unwrap(astResult)
    );

    if (isFailure(elementsResult)) return elementsResult;

    (<TypedEmitter<Events>>process).emit(
      "elementExtractionComplete",
      this,
      filePath,
      unwrap(elementsResult)
    );

    return elementsResult;
  }

  @cache("relations")
  @resolvePath()
  getRelations(filePath: string): Result<Map<string, Relation>> {
    (<TypedEmitter<Events>>process).emit(
      "relationExtractionStart",
      this,
      filePath
    );

    const result = this.getAbstractSyntaxTree(filePath);

    if (isFailure(result)) return result;

    const relationsResult = this._typeExtractor.extractRelations(
      filePath,
      unwrap(result)
    );

    if (isFailure(relationsResult)) return relationsResult;

    (<TypedEmitter<Events>>process).emit(
      "relationExtractionComplete",
      this,
      filePath,
      unwrap(relationsResult)
    );

    return relationsResult;
  }

  @cache("objects")
  @resolvePath()
  getObjectTypes(filePath: string): Result<Map<string, DiscoveredObjectType>> {
    (<TypedEmitter<Events>>process).emit(
      "objectTypeExtractionStart",
      this,
      filePath
    );

    const result = this.getAbstractSyntaxTree(filePath);

    if (isFailure(result)) return result;

    const objectsResult = this._typeExtractor.extractObjectTypes(
      filePath,
      unwrap(result)
    );

    if (isFailure(objectsResult)) return objectsResult;

    (<TypedEmitter<Events>>process).emit(
      "objectTypeExtractionComplete",
      this,
      filePath,
      unwrap(objectsResult)
    );

    return objectsResult;
  }

  @cache("constantPool")
  @resolvePath()
  getConstantPoolManager(filePath: string): Result<ConstantPoolManager> {
    RootContext.LOGGER.info("Extracting constants");
    const astResult = this.getAbstractSyntaxTree(filePath);

    if (isFailure(astResult)) return astResult;

    const targetConstantPool = this._constantPoolFactory.extract(
      filePath,
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

  resolveTypes(): void {
    this._typePool = new TypePool();

    // TODO allow sub selections of files (do not consider entire context)
    if (!this._typeModel) {
      (<TypedEmitter<Events>>process).emit("typeResolvingStart", this);
      for (const filePath of this._analysisFiles) {
        const elements = this.getElements(filePath);
        const relations = this.getRelations(filePath);
        const objects = this.getObjectTypes(filePath);
        const exports = this.getExports(filePath);

        if (isFailure(elements)) {
          RootContext.LOGGER.warn(elements.error.message);
          continue;
        }
        if (isFailure(relations)) {
          RootContext.LOGGER.warn(relations.error.message);
          continue;
        }
        if (isFailure(objects)) {
          RootContext.LOGGER.warn(objects.error.message);
          continue;
        }
        if (isFailure(exports)) {
          RootContext.LOGGER.warn(exports.error.message);
          continue;
        }

        this._typeModel = this._typeResolver.resolveTypes(
          elements.result,
          relations.result
        );

        this._typePool.extractExportedTypes(exports.result, objects.result);
      }

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
    for (const filePath of this._analysisFiles) {
      const result = this.getAbstractSyntaxTree(filePath);

      if (isFailure(result)) return result;

      this._constantPoolFactory.extract(filePath, unwrap(result), constantPool);
    }

    return success(constantPool);
  }
}
