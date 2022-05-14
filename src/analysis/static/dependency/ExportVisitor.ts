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
            type: this._getType(declaration.init.type, declaration.name),
            default: false,
            module: false,
            filePath: this.filePath
          })
        }
      }
       else {
        this._exports.push({
          name: path.node.declaration.id.name,
          type: this._getType(path.node.declaration.type, path.node.declaration.name),
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
          type: this._getType(specifier.local.type, specifier.local.name),
          default: specifier.local.name === 'default' || specifier.exported.name === 'default',
          module: false,
          filePath: this.filePath
        })
      }
    }

    // throw new Error('ANY named export')
  };

  public ExportDefaultDeclaration: (path) => void = (path) => {
    this._exports.push({
      name: path.node.declaration.name,
      type: this._getType(path.node.declaration.type, path.node.declaration.name),
      default: true,
      module: false,
      filePath: this.filePath
    })
  };

  public ExpressionStatement: (path) => void = (path) => {
    if (path.node.expression.type === 'AssignmentExpression'
      && path.node.expression.left.type === 'MemberExpression'
    ) {
      if (path.node.expression.left.object.name === 'module'
        && path.node.expression.left.property.name === 'exports'
      ) {
        if (path.node.expression.right.type === 'Identifier') {
          this._exports.push({
            name: path.node.expression.right.name,
            type: this._getType(path.node.expression.right.type, path.node.expression.right.name),
            default: true,
            module: true,
            filePath: this.filePath
          })
        } else if (path.node.expression.right.type === 'Literal'
          || path.node.expression.right.type === 'ArrayExpression') {
          this._exports.push({
            name: `${path.node.expression.right.type}`,
            type: ExportType.const,
            default: true,
            module: true,
            filePath: this.filePath
          })
        } else if (path.node.expression.right.type === 'ObjectExpression') {
          for (const property of path.node.expression.right.properties) {
            this._exports.push({
              name: property.key.name,
              type: this._getType(property.key.type, property.key.name),
              default: false,
              module: true,
              filePath: this.filePath
            })
          }
        } else if (path.node.expression.right.type === 'FunctionExpression') {
          this._exports.push({
            name: path.node.expression.right.id.name,
            type: this._getType(path.node.expression.right.type, path.node.expression.right.name),
            default: true,
            module: true,
            filePath: this.filePath
          })
        }
      } else if (path.node.expression.left.object.name === 'exports') {
        if (path.node.expression.right.type === 'Identifier') {
          this._exports.push({
            name: path.node.expression.left.property.type === 'Identifier' ? path.node.expression.left.property.name : path.node.expression.left.property.value,
            type: this._getType(path.node.expression.right.type, path.node.expression.right.name),
            default: false,
            module: false,
            filePath: this.filePath
          })
        } else if (path.node.expression.right.type === 'Literal'
          || path.node.expression.right.type === 'ArrayExpression'
          || path.node.expression.right.type === 'ObjectExpression') {
          this._exports.push({
            name: path.node.expression.left.property.type === 'Identifier' ? path.node.expression.left.property.name : path.node.expression.left.property.value,
            type: ExportType.const,
            default: false,
            module: false,
            filePath: this.filePath
          })
        }
      }
    }
  };

  // util function
  _getType(type: string, name?: string): ExportType {
    if (type === 'FunctionDeclaration'
      || type === 'FunctionExpression') {
      return ExportType.function
    } else if (type === 'VariableDeclaration'
      || type === 'VariableDeclarator') {
      return ExportType.const
    }  else if (type === 'NewExpression') {
      return ExportType.const
    } else if (type === 'ClassDeclaration') {
      return ExportType.class
    } else if (type === 'Identifier') {
      if (!this._identifiers.has(name)) {
        // TODO for now we just assume const when we have not found such an identifier
        return ExportType.const
        // throw new Error("Cannot find identifier that is exported: " + name + " - " + type)
      }

      return this._identifiers.get(name)
    } else if (type === 'StringLiteral'
      || type === 'TemplateLiteral'
      || type === 'NumericLiteral'
      || type === 'BooleanLiteral'
      || type === 'RegExpLiteral'
      || type === 'NullLiteral') {
      return ExportType.const
    } else if (type === 'CallExpression'
      || type === 'MemberExpression'
      || type === 'ObjectExpression') {
      // we dont know what this returns
      return ExportType.const
    }

    // default is const
    // return ExportType.const

    throw new Error("ANY export identifierDescription: " + type + " in target file: " + this.filePath)
  }

  // getters
  get exports(): Export[] {
    return this._exports;
  }
}


