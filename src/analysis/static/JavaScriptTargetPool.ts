/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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
import {
  CFG,
  FunctionDescription,
  TargetMetaData,
  TargetPool,
} from "@syntest/framework";
import { TargetMapGenerator } from "./map/TargetMapGenerator";
import { JavaScriptFunction } from "./map/JavaScriptFunction";

export class JavaScriptTargetPool extends TargetPool {
  protected abstractSyntaxTreeGenerator: AbstractSyntaxTreeGenerator;
  protected targetMapGenerator: TargetMapGenerator;
  protected controlFlowGraphGenerator;

  // Mapping: filepath -> source code
  protected _sources: Map<string, string>;

  // Mapping: filepath -> AST
  protected _abstractSyntaxTrees: Map<string, any>;

  // Mapping: filepath -> target name -> target meta data
  protected _targetMap: Map<string, Map<string, TargetMetaData>>;

  // Mapping: filepath -> target name -> function name -> function
  protected _functionMaps: Map<
    string,
    Map<string, Map<string, JavaScriptFunction>>
  >;

  // Mapping: filepath -> target name -> (function name -> CFG)
  protected _controlFlowGraphs: Map<string, Map<string, CFG>>;

  constructor(
    abstractSyntaxTreeGenerator: AbstractSyntaxTreeGenerator,
    targetMapGenerator: TargetMapGenerator
  ) {
    super();
    this.abstractSyntaxTreeGenerator = abstractSyntaxTreeGenerator;
    this.targetMapGenerator = targetMapGenerator;

    this._sources = new Map<string, string>();
    this._abstractSyntaxTrees = new Map<string, string>();
    this._targetMap = new Map<string, Map<string, TargetMetaData>>();
    this._functionMaps = new Map<
      string,
      Map<string, Map<string, JavaScriptFunction>>
    >();
    this._controlFlowGraphs = new Map<string, Map<string, CFG>>();
  }

  getSource(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._sources.has(absoluteTargetPath)) {
      this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath));
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

    // TODO

    return new CFG()
  }

  getTargetMap(targetPath: string): Map<string, TargetMetaData> {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._targetMap.has(absoluteTargetPath)) {
      const targetAST = this.getAST(absoluteTargetPath);
      const { targetMap, functionMap } =
        this.targetMapGenerator.generate(targetAST);
      this._targetMap.set(absoluteTargetPath, targetMap);
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
      const targetAST = this.getAST(absoluteTargetPath);
      const { targetMap, functionMap } =
        this.targetMapGenerator.generate(targetAST);
      this._targetMap.set(absoluteTargetPath, targetMap);
      this._functionMaps.set(absoluteTargetPath, functionMap);
    }

    if (this._functionMaps.get(absoluteTargetPath).has(targetName)) {
      return this._functionMaps.get(absoluteTargetPath).get(targetName);
    } else {
      throw new Error(
        `Target ${targetName} could not be found at ${targetPath}`
      );
    }
  }

  getImportDependencies(targetPath: string, targetName: string):  [Map<string, string>, Map<string, string[]>] {
    // TODO

    return [new Map(), new Map()]
  }
}
