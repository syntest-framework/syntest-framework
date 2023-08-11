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
import { getAllFiles, readFile } from "./utils/fileSystem";
import { ExportFactory } from "./target/export/ExportFactory";
import { TypeExtractor } from "./type/discovery/TypeExtractor";
import { TypeModel } from "./type/resolving/TypeModel";
import { Element } from "./type/discovery/element/Element";
import { DiscoveredObjectType } from "./type/discovery/object/DiscoveredType";
import { Relation } from "./type/discovery/relation/Relation";
import { TypePool } from "./type/resolving/TypePool";

export class RootContext extends CoreRootContext<t.Node> {
  protected _exportFactory: ExportFactory;
  protected _typeExtractor: TypeExtractor;
  protected _typeResolver: TypeModelFactory;

  protected _files: string[];
  protected _elementMap: Map<string, Element>;
  protected _relationMap: Map<string, Relation>;
  protected _objectMap: Map<string, DiscoveredObjectType>;

  protected _typeModel: TypeModel;
  protected _typePool: TypePool;

  // Mapping: filepath -> target name -> Exports
  protected _exportMap: Map<string, Export[]>;

  constructor(
    rootPath: string,
    abstractSyntaxTreeFactory: AbstractSyntaxTreeFactory,
    controlFlowGraphFactory: ControlFlowGraphFactory,
    targetFactory: TargetFactory,
    dependencyFactory: DependencyFactory,
    exportFactory: ExportFactory,
    typeExtractor: TypeExtractor,
    typeResolver: TypeModelFactory
  ) {
    super(
      rootPath,
      undefined,
      abstractSyntaxTreeFactory,
      controlFlowGraphFactory,
      targetFactory,
      dependencyFactory
    );
    this._exportFactory = exportFactory;
    this._typeExtractor = typeExtractor;
    this._typeResolver = typeResolver;
  }

  get rootPath(): string {
    return this._rootPath;
  }

  // TODO something with the types

  getFiles() {
    if (!this._files) {
      this._files = getAllFiles(this.rootPath, ".js").filter(
        (x) =>
          !x.includes("/test/") &&
          !x.includes(".test.js") &&
          !x.includes("node_modules")
      ); // maybe we should also take those into account
    }

    return this._files;
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

  private getExports(filePath: string): Export[] {
    const absolutePath = this.resolvePath(filePath);

    if (!this._exportMap.has(absolutePath)) {
      return this._exportFactory.extract(
        absolutePath,
        this.getAbstractSyntaxTree(absolutePath)
      );
    }

    return this._exportMap.get(absolutePath);
  }

  getAllExports(): Map<string, Export[]> {
    if (!this._exportMap) {
      this._exportMap = new Map();

      for (const filepath of this.getFiles()) {
        this._exportMap.set(filepath, this.getExports(filepath));
      }
    }
    return this._exportMap;
  }

  extractTypes(): void {
    if (!this._elementMap || !this._relationMap || !this._objectMap) {
      this._typeExtractor.extractAll(this);
      this._elementMap = this._typeExtractor.elementMap;
      this._relationMap = this._typeExtractor.relationMap;
      this._objectMap = this._typeExtractor.objectMap;
    }
  }

  resolveTypes(): void {
    if (!this._elementMap || !this._relationMap || !this._objectMap) {
      this.extractTypes();
    }

    if (!this._typeModel) {
      this._typeModel = this._typeResolver.resolveTypes(
        this._elementMap,
        this._relationMap
      );
      this._typePool = new TypePool(this._objectMap, this.getAllExports());
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

  getElement(id: string): Element {
    if (!this._elementMap || !this._elementMap.has(id)) {
      this.extractTypes();
    }
    return this._elementMap.get(id);
  }

  getRelation(id: string): Relation {
    if (!this._relationMap || !this._relationMap.has(id)) {
      this.extractTypes();
    }
    return this._relationMap.get(id);
  }

  getObject(id: string): DiscoveredObjectType {
    if (!this._objectMap || !this._objectMap.has(id)) {
      this.extractTypes();
    }
    return this._objectMap.get(id);
  }
}
