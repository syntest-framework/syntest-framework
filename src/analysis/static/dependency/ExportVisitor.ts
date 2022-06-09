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

import { ExportType } from "./IdentifierVisitor";
import { Visitor } from "../Visitor";

export interface Export {
  name: string,
  type: ExportType,
  default: boolean,
  module: boolean,
  filePath: string
}

export class ExportVisitor extends Visitor {
  // TODO other export types such as module.export or exports.

  private _exports: Export[];
  private _identifiers: Map<string, ExportType>

  constructor(filePath: string, identifiers: Map<string, ExportType>) {
    super(filePath)
    this._exports = [];
    this._identifiers = identifiers
  }

  // exports
  public ExportNamedDeclaration: (path) => void = (path) => {
    if (path.node.declaration) {
      if (path.node.declaration.declarations) {
        for (const declaration of path.node.declaration.declarations) {
          this._exports.push({
            name: declaration.id.name,
            type: this._getType(declaration.init?.type, declaration),
            default: false,
            module: false,
            filePath: this.filePath
          })
        }
      }
       else {
        this._exports.push({
          name: path.node.declaration.id.name,
          type: this._getType(path.node.declaration.type, path.node.declaration),
          default: false,
          module: false,
          filePath: this.filePath
        })
       }

    } else if (path.node.specifiers) {

      if (path.node.source) {
        // TODO skip because we already tested it in another file
        return
      }

      for (const specifier of path.node.specifiers) {
        this._exports.push({
          name: specifier.local.name,
          type: this._getType(specifier.local.type, specifier.local),
          default: specifier.local.name === 'default' || specifier.exported.name === 'default',
          module: false,
          filePath: this.filePath
        })
      }
    }

    // throw new Error('ANY named export')
  };

  public ExportDefaultDeclaration: (path) => void = (path) => {
    let name: string

    if (path.node.declaration.type === 'Identifier') {
      name = path.node.declaration.name
    } else if (path.node.declaration.type === 'NewExpression') {
      name = path.node.declaration.callee.name
    } else {
      name = path.node.declaration.id?.name
    }

    if (!name) {
      return
    }

    this._exports.push({
      name: name,
      type: this._getType(path.node.declaration.type, path.node.declaration),
      default: true,
      module: false,
      filePath: this.filePath
    })
  };

  public ExpressionStatement: (path) => void = (path) => {
    if (path.node.expression.type !== 'AssignmentExpression') {
      return
    }

    const left = path.get('expression').get('left')
    const right = path.get('expression').get('right')

    let name: string
    let default_ = false

    if (left.isIdentifier() && left.node.name === 'exports') {
      name = this._getName(right.node)
      default_ = true
    } else if (left.isMemberExpression()) {
      const object = left.get('object')
      const property = left.get('property')

      if (object.isIdentifier()) {
        if (object.node.name === 'exports') {
          name = this._getName(property.node)
        } else if (object.node.name === 'module'
          && property.node.name === 'exports') {
          name = this._getName(right.node)
          default_ = true
        }
      } else if (object.isMemberExpression()) {
        const higherObject = object.get('object')
        const higherProperty = object.get('property')

        if (higherObject.isIdentifier()) {
         if (higherObject.node.name === 'module'
            && higherProperty.node.name === 'exports') {
            name = this._getName(property.node)
          }
        }
      }
    }

    if (!name) {
      return
    }

    if (right.isObjectExpression()) {
      for (const property of right.node.properties) {
        this._exports.push({
          name: this._getName(property.key),
          type: this._getType(property.key.type, property.key),
          default: default_,
          module: true,
          filePath: this.filePath
        })
      }
    } else if (right.isArrayExpression()) {
      for (const element of right.node.elements) {
        this._exports.push({
          name: this._getName(element),
          type: this._getType(element.type, element),
          default: default_,
          module: true,
          filePath: this.filePath
        })
      }
    } else {
      this._exports.push({
        name: name,
        type: this._getType(right.node.type, right.node),
        default: default_,
        module: true,
        filePath: this.filePath
      })
    }
  };

  private _getName(node): string {
    switch (node.type) {
      case 'Identifier':
        return node.name
      case 'Literal':
      case 'ArrayExpression':
      case 'ObjectExpression':
        return `${node.type}`
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        return node.id?.name || 'anon'
    }

    // throw new Error(`Cannot get name of node of type ${node.type}`)
    return 'anon'
  }

  // util function
  _getType(type: string, node): ExportType {
    if (type === 'FunctionDeclaration'
      || type === 'FunctionExpression'
      || type === 'ArrowFunctionExpression') {
      return ExportType.function
    } else if (type === 'VariableDeclaration'
      || type === 'VariableDeclarator') {
      return ExportType.const
    }  else if (type === 'NewExpression') {
      return ExportType.const
    } else if (type === 'ClassDeclaration') {
      return ExportType.class
    } else if (type === 'Identifier') {
      if (!this._identifiers.has(node.name)) {
        // TODO for now we just assume const when we have not found such an identifier
        return ExportType.const
        // throw new Error("Cannot find identifier that is exported: " + name + " - " + type)
      }

      return this._identifiers.get(node.name)
    } else if (type === 'StringLiteral'
      || type === 'TemplateLiteral'
      || type === 'NumericLiteral'
      || type === 'BooleanLiteral'
      || type === 'RegExpLiteral'
      || type === 'NullLiteral') {
      return ExportType.const
    }

    // we dont know what this returns
    // default is const
    return ExportType.unknown
  }

  // getters
  get exports(): Export[] {
    return this._exports;
  }
}


