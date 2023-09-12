/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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
import { RootContext as CoreRootContext } from "@syntest/analysis";

import { AbstractSyntaxTreeFactory } from "./ast/AbstractSyntaxTreeFactory";
import { ControlFlowGraphFactory } from "./cfg/ControlFlowGraphFactory";
import { DependencyFactory } from "./dependency/DependencyFactory";
import { Export } from "./target/export/Export";
import { TargetFactory } from "./target/TargetFactory";
import { TypeModelFactory } from "./type/resolving/TypeModelFactory";
import { readFile } from "./utils/fileSystem";
import { ExportFactory } from "./target/export/ExportFactory";
import { TypeExtractor } from "./type/discovery/TypeExtractor";
import { TypeModel } from "./type/resolving/TypeModel";
import { Element } from "./type/discovery/element/Element";
import { DiscoveredObjectType } from "./type/discovery/object/DiscoveredType";
import { Relation } from "./type/discovery/relation/Relation";
import { TypePool } from "./type/resolving/TypePool";
import TypedEmitter from "typed-emitter";
import { Events } from "./Events";
import { ConstantPoolManager } from "./constant/ConstantPoolManager";
import { Logger, getLogger } from "@syntest/logging";
import { ConstantPoolFactory } from "./constant/ConstantPoolFactory";
import { ConstantPool } from "./constant/ConstantPool";

export class RootContext extends CoreRootContext<t.Node> {
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
    RootContext.LOGGER = getLogger("RootContext");
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

  override getSource(filePath: string) {
    let absoluteTargetPath = this.resolvePath(filePath);

    if (!this._sources.has(absoluteTargetPath)) {
      if (!existsSync(absoluteTargetPath)) {
        if (existsSync(absoluteTargetPath + ".js")) {
          absoluteTargetPath += ".js";
        } else if (existsSync(absoluteTargetPath + ".ts")) {
          absoluteTargetPath += ".ts";
        } else {
          throw new Error("Cannot find source: " + absoluteTargetPath);
        }
      }

      const stats = lstatSync(absoluteTargetPath);

      if (stats.isDirectory()) {
        if (existsSync(absoluteTargetPath + "/index.js")) {
          absoluteTargetPath += "/index.js";
        } else if (existsSync(absoluteTargetPath + "/index.ts")) {
          absoluteTargetPath += "/index.ts";
        } else {
          throw new Error("Cannot find source: " + absoluteTargetPath);
        }
      }

      this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath));
    }

    return this._sources.get(absoluteTargetPath);
  }

  getExports(filePath: string): Export[] {
    const absolutePath = this.resolvePath(filePath);

    if (!this._exportMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "exportExtractionStart",
        this,
        absolutePath
      );
      this._exportMap.set(
        absolutePath,
        this._exportFactory.extract(
          absolutePath,
          this.getAbstractSyntaxTree(absolutePath)
        )
      );
      (<TypedEmitter<Events>>process).emit(
        "exportExtractionComplete",
        this,
        absolutePath
      );
    }

    return this._exportMap.get(absolutePath);
  }

  getAllExports(): Map<string, Export[]> {
    if (!this._exportMap) {
      this._exportMap = new Map();

      for (const filepath of this._analysisFiles) {
        this._exportMap.set(filepath, this.getExports(filepath));
      }
    }
    return this._exportMap;
  }

  getElements(filepath: string) {
    const absolutePath = this.resolvePath(filepath);

    if (!this._elementMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "elementExtractionStart",
        this,
        absolutePath
      );
      const elementMap = this._typeExtractor.extractElements(
        absolutePath,
        this.getAbstractSyntaxTree(absolutePath)
      );

      this._elementMap.set(absolutePath, elementMap);
      (<TypedEmitter<Events>>process).emit(
        "elementExtractionComplete",
        this,
        absolutePath
      );
    }

    return this._elementMap.get(absolutePath);
  }

  getAllElements() {
    if (!this._elementMap) {
      this._elementMap = new Map();

      for (const filepath of this._analysisFiles) {
        this._elementMap.set(filepath, this.getElements(filepath));
      }
    }
    return this._elementMap;
  }

  getRelations(filepath: string) {
    const absolutePath = this.resolvePath(filepath);

    if (!this._relationMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "relationExtractionStart",
        this,
        absolutePath
      );
      const relationsMap = this._typeExtractor.extractRelations(
        absolutePath,
        this.getAbstractSyntaxTree(absolutePath)
      );

      this._relationMap.set(absolutePath, relationsMap);
      (<TypedEmitter<Events>>process).emit(
        "relationExtractionComplete",
        this,
        absolutePath
      );
    }

    return this._relationMap.get(absolutePath);
  }

  getAllRelations() {
    if (!this._relationMap) {
      this._relationMap = new Map();

      for (const filepath of this._analysisFiles) {
        this._relationMap.set(filepath, this.getRelations(filepath));
      }
    }
    return this._relationMap;
  }

  getObjectTypes(filepath: string) {
    const absolutePath = this.resolvePath(filepath);

    if (!this._objectMap.has(absolutePath)) {
      (<TypedEmitter<Events>>process).emit(
        "objectTypeExtractionStart",
        this,
        absolutePath
      );
      const objectsMap = this._typeExtractor.extractObjectTypes(
        absolutePath,
        this.getAbstractSyntaxTree(absolutePath)
      );

      this._objectMap.set(absolutePath, objectsMap);
      (<TypedEmitter<Events>>process).emit(
        "objectTypeExtractionComplete",
        this,
        absolutePath
      );
    }

    return this._objectMap.get(absolutePath);
  }

  getAllObjectTypes() {
    if (!this._objectMap) {
      this._objectMap = new Map();

      for (const filepath of this._analysisFiles) {
        this._objectMap.set(filepath, this.getObjectTypes(filepath));
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
  private _getContextConstantPool(): ConstantPool {
    const constantPool = new ConstantPool();
    for (const filepath of this._analysisFiles) {
      const ast = this.getAbstractSyntaxTree(filepath);
      this._constantPoolFactory.extract(filepath, ast, constantPool);
    }

    return constantPool;
  }

  // TODO cache
  getConstantPoolManager(filepath: string): ConstantPoolManager {
    const absolutePath = this.resolvePath(filepath);

    RootContext.LOGGER.info("Extracting constants");
    const ast = this.getAbstractSyntaxTree(absolutePath);

    const targetConstantPool = this._constantPoolFactory.extract(
      absolutePath,
      ast
    );
    const contextConstantPool = this._getContextConstantPool();
    const dynamicConstantPool = new ConstantPool();

    const constantPoolManager = new ConstantPoolManager(
      targetConstantPool,
      contextConstantPool,
      dynamicConstantPool
    );

    RootContext.LOGGER.info("Extracting constants done");
    return constantPoolManager;
  }
}
