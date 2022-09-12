/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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
import { Visitor } from "../Visitor";

export class ImportVisitor extends Visitor {
  private _imports: Set<string>;

  constructor(filePath) {
    super(filePath)
    this._imports = new Set<string>();
  }

  public ImportDeclaration: (path) => void = (path) => {
    this._imports.add(path.node.source.value)
  };

  public CallExpression: (path) => void = (path) => {
    if (path.node.callee.name === 'require') {

      if (path.node.arguments[0].type === 'StringLiteral') {
        this._imports.add(path.node.arguments[0].value)
      } else {
        // This tool does not support dynamic require statements.
        // throw new Error("This tool does not support dynamic require statements.")
      }
    }
  };

  get imports(): Set<string> {
    return this._imports;
  }
}
