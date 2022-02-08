/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Javascript.
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
import * as path from "path";
import { readFile } from "../../utils/fileSystem";
import { AbstractSyntaxTreeGenerator } from "./ast/AbstractSyntaxTreeGenerator";
import { CFG, TargetMetaData, TargetPool } from "@syntest/framework";
import { TargetMapGenerator } from "./map/TargetMapGenerator";
import { JavaScriptFunction } from "./map/JavaScriptFunction";
import { ControlFlowGraphGenerator } from "./cfg/ControlFlowGraphGenerator";
import { ImportGenerator } from "./dependency/ImportGenerator";
import { ExportGenerator } from "./dependency/ExportGenerator";
import { existsSync } from "fs";
import { Export, ExportType } from "./dependency/ExportVisitor";
import { SubjectType } from "../../search/JavaScriptSubject";
import { Typing } from "./types/Typing";
import { TypeResolver } from "./types/TypeResolver";
import { Scope } from "./variable/Scope";
import { Element } from "./variable/Element";
import { VariableGenerator } from "./variable/VariableGenerator";
import { TypeResolverInference } from "./types/TypeResolverInference";

export interface JavaScriptTargetMetaData extends TargetMetaData {
  type: SubjectType,
  export: Export
}

export class JavaScriptTargetPool extends TargetPool {
  protected abstractSyntaxTreeGenerator: AbstractSyntaxTreeGenerator;
  protected targetMapGenerator: TargetMapGenerator;
  protected controlFlowGraphGenerator: ControlFlowGraphGenerator;
  protected importGenerator: ImportGenerator;
  protected exportGenerator: ExportGenerator;

  // Mapping: filepath -> source code
  protected _sources: Map<string, string>;

  // Mapping: filepath -> AST
  protected _abstractSyntaxTrees: Map<string, any>;

  // Mapping: filepath -> target name -> target meta data
  protected _targetMap: Map<string, Map<string, JavaScriptTargetMetaData>>;

  // Mapping: filepath -> target name -> function name -> function
  protected _functionMaps: Map<
    string,
    Map<string, Map<string, JavaScriptFunction>>
  >;

  // Mapping: filepath -> target name -> (function name -> CFG)
  protected _controlFlowGraphs: Map<string, Map<string, CFG>>;

  // Mapping: filepath -> target name -> [importsMap, dependencyMap]
  // TODO better name...
  protected _dependencyMaps: Map<
    string,
    Map<string, [Map<string, string>, Map<string, Export[]>]>
    >;

  // Mapping: filepath -> target name -> Exports
  protected _exportMap: Map<string, Export[]>

  constructor(
    abstractSyntaxTreeGenerator: AbstractSyntaxTreeGenerator,
    targetMapGenerator: TargetMapGenerator,
    controlFlowGraphGenerator: ControlFlowGraphGenerator,
    importGenerator: ImportGenerator,
    exportGenerator: ExportGenerator
  ) {
    super();
    this.abstractSyntaxTreeGenerator = abstractSyntaxTreeGenerator;
    this.targetMapGenerator = targetMapGenerator;
    this.controlFlowGraphGenerator = controlFlowGraphGenerator;
    this.importGenerator = importGenerator;
    this.exportGenerator = exportGenerator;

    this._sources = new Map<string, string>();
    this._abstractSyntaxTrees = new Map<string, string>();
    this._targetMap = new Map<string, Map<string, JavaScriptTargetMetaData>>();
    this._functionMaps = new Map<
      string,
      Map<string, Map<string, JavaScriptFunction>>
    >();
    this._controlFlowGraphs = new Map<string, Map<string, CFG>>();

    this._dependencyMaps = new Map();

    this._exportMap = new Map()
  }

  getSource(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._sources.has(absoluteTargetPath)) {
      if (existsSync(absoluteTargetPath)) {
        this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath));

      } else if (existsSync(absoluteTargetPath + '.js')) {
        this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath + '.js'));

      } else if (existsSync(absoluteTargetPath + '.ts')) {
        this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath + '.ts'));
      } else {
        throw new Error("Cannot find source: " + absoluteTargetPath)
      }
    }

    return this._sources.get(absoluteTargetPath);
  }

  getAST(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._abstractSyntaxTrees.has(absoluteTargetPath)) {
      this._abstractSyntaxTrees.set(
        absoluteTargetPath,
        this.abstractSyntaxTreeGenerator.generate(
          this.getSource(targetPath),
          absoluteTargetPath
        )
      );
    }

    return this._abstractSyntaxTrees.get(absoluteTargetPath);
  }

  getCFG(targetPath: string, targetName: string): CFG {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._controlFlowGraphs.has(absoluteTargetPath)) {
      this._controlFlowGraphs.set(absoluteTargetPath, new Map<string, CFG>())
    }

    if (!this._controlFlowGraphs.get(absoluteTargetPath).has(targetName)) {
      this._controlFlowGraphs.get(absoluteTargetPath).set(
        targetName,
        this.controlFlowGraphGenerator.convertAST(
          this.getAST(absoluteTargetPath)
        )
      );
    }

    return this._controlFlowGraphs.get(absoluteTargetPath).get(targetName);
  }

  getTargetMap(targetPath: string): Map<string, JavaScriptTargetMetaData> {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._targetMap.has(absoluteTargetPath)) {
      const targetAST = this.getAST(absoluteTargetPath);
      const { targetMap, functionMap } =
        this.targetMapGenerator.generate(targetAST);

      const exports = this.getExports(targetPath)

      const finalTargetMap = new Map<string, JavaScriptTargetMetaData>()

      for (const key of targetMap.keys()) {
        const name = targetMap.get(key).name
        const export_ = exports.find((e) => e.name === name)

        if (!export_) {
          // No export found so we cannot import it and thus not test it
          continue
        }

        if(export_.type === ExportType.const) {
          throw new Error("Target cannot be constant!")
        }

        finalTargetMap.set(key, {
          name: name,
          type: export_.type === ExportType.function ? SubjectType.function : SubjectType.class,
          export: export_
        })
      }

      this._targetMap.set(absoluteTargetPath, finalTargetMap);
      this._functionMaps.set(absoluteTargetPath, functionMap);
    }

    return this._targetMap.get(absoluteTargetPath);
  }

  getFunctionMap(
    targetPath: string,
    targetName: string
  ): Map<string, JavaScriptFunction> {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._functionMaps.has(absoluteTargetPath)) {
      this.getTargetMap(absoluteTargetPath)
    }

    if (this._functionMaps.get(absoluteTargetPath).has(targetName)) {
      return this._functionMaps.get(absoluteTargetPath).get(targetName);
    } else {
      throw new Error(
        `Target ${targetName} could not be found at ${targetPath}`
      );
    }
  }

  getExports(targetPath: string): Export[] {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._exportMap.has(absoluteTargetPath)) {
      const exports = this.exportGenerator.generate(absoluteTargetPath, this.getAST(absoluteTargetPath))

      this._exportMap.set(absoluteTargetPath, exports);
    }

    return this._exportMap.get(absoluteTargetPath)
  }

  getImportDependencies(targetPath: string, targetName: string):  [Map<string, string>, Map<string, Export[]>] {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._dependencyMaps.has(absoluteTargetPath))
      this._dependencyMaps.set(absoluteTargetPath, new Map());

    if (!this._dependencyMaps.get(absoluteTargetPath).has(targetName)) {
      // Import the contract under test
      const importsMap = new Map<string, string>();
      importsMap.set(targetName, targetName);

      // Find all external imports in the contract under test
      const imports = this.importGenerator.generate(this.getAST(targetPath))

      // For each external import scan the file for libraries with exported functions
      const libraries: Export[] = [];
      imports.forEach((importPath: string) => {
        // Full path to the imported file
        const pathLib = path.join(path.dirname(targetPath), importPath);

        // Scan for libraries with public or external functions
        const exports = this.getExports(pathLib)

        // Import the external file in the test
        importsMap.set(
          path.basename(importPath).split(".")[0],
          path.basename(importPath).split(".")[0]
        );

        // Import the found libraries
        // TODO: check for duplicates in libraries
        libraries.push(...exports);
      });

      // Return the library dependency information
      const dependencyMap = new Map<string, Export[]>();
      dependencyMap.set(targetName, libraries);

      this._dependencyMaps
        .get(targetPath)
        .set(targetName, [importsMap, dependencyMap]);
    }

    return this._dependencyMaps.get(absoluteTargetPath).get(targetName);
  }
}
