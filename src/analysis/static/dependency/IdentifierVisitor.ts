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

export enum ExportType {
  function,
  class,
  const,
  unknown
}

export class IdentifierVisitor extends Visitor {
  private _identifiers: Map<string, ExportType>

  get identifiers(): Map<string, ExportType> {
    return this._identifiers;
  }

  constructor(filePath: string) {
    super(filePath)
    this._identifiers = new Map<string, ExportType>()
  }

  // identifiable stuff
  public FunctionDeclaration: (path) => void = (path) => {
    let identifier = path.node.id?.name;

    if (path.parent.type === 'ObjectPattern') {
      identifier = path.parent.key.name
    } else if (path.parent.type === 'ExportDefaultDeclaration') {
      identifier = 'default'
    }

    if (!identifier) {
      throw new Error(`Unsupported identifier declaration: ${path.parent.type}`)
    }

    this._identifiers.set(identifier, ExportType.function)
  }

  public ClassDeclaration: (path) => void = (path) => {
    const identifier = path.node.id.name;
    this._identifiers.set(identifier, ExportType.class)
  }

  public VariableDeclaration: (path) => void = (path) => {
    for (const declaration of path.node.declarations) {
      const identifier = declaration.id.name;

      if (declaration.id.type === 'ObjectPattern') {
        // TODO support this
        continue
      }

      if (!declaration.init) {
        this._identifiers.set(identifier, ExportType.unknown)
      } else if (declaration.init.type === "ArrowFunctionExpression"
        || declaration.init.type === "FunctionExpression") {
        this._identifiers.set(identifier, ExportType.function) // not always the case
      } else {
        this._identifiers.set(identifier, ExportType.const) // not always the case
      }
    }
  }
}


