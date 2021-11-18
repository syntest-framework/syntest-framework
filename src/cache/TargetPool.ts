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
import * as path from 'path'
import { readFile } from "../utils/fileSystem";
import { AbstractSyntaxTreeGenerator } from "../analysis/AbstractSyntaxTreeGenerator";

export class TargetPool {
  protected abstractSyntaxTreeGenerator: AbstractSyntaxTreeGenerator
  protected targetMapGenerator
  protected controlFlowGraphGenerator

  // Mapping: filepath -> source code
  protected _sources: Map<string, string>

  // Mapping: filepath -> AST
  protected _abstractSyntaxTrees: Map<string, any>;

  constructor(abstractSyntaxTreeGenerator: AbstractSyntaxTreeGenerator) {
    this.abstractSyntaxTreeGenerator = abstractSyntaxTreeGenerator
    this._sources = new Map<string, string>()
  }

  getSource(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._sources.has(absoluteTargetPath)) {
      this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath))
    }

    return this._sources.get(absoluteTargetPath)
  }

  getAST(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._abstractSyntaxTrees.has(absoluteTargetPath)) {
      this._abstractSyntaxTrees.set(
        absoluteTargetPath,
        this.abstractSyntaxTreeGenerator.getAST(
          this.getSource(targetPath),
          absoluteTargetPath,
          {}
        )
      )
    }

    this._abstractSyntaxTrees.get(absoluteTargetPath)
  }

  getCFG(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

  }

  getFunctionMap(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

  }

  getTargetMap(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

  }
}
