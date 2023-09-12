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

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { AbstractSyntaxTreeVisitor } from "@syntest/ast-visitor-javascript";
import { getLogger, Logger } from "@syntest/logging";

export class DependencyVisitor extends AbstractSyntaxTreeVisitor {
  protected static override LOGGER: Logger;

  private _imports: Set<string>;

  constructor(filePath: string, syntaxForgiving: boolean) {
    super(filePath, syntaxForgiving);
    DependencyVisitor.LOGGER = getLogger("DependencyVisitor");
    this._imports = new Set<string>();
  }

  public ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => void = (
    path
  ) => {
    this._imports.add(path.node.source.value);
  };

  public Import: (path: NodePath<t.Import>) => void = (path) => {
    const parentNode = path.parentPath.node;

    if (parentNode.type === "CallExpression") {
      // e.g. import(?)
      if (parentNode.arguments.length === 1) {
        if (parentNode.arguments[0].type === "StringLiteral") {
          // e.g. import('module1')
          this._imports.add(parentNode.arguments[0].value);
        } else {
          // e.g. import('module' + '1')
          // e.g. import(`module${1}`)
          // e.g. import(x)
          // This tool does not support computed dynamic import statements.
          DependencyVisitor.LOGGER.warn(
            `This tool does not support computed dynamic import statements. Found one at ${this._getNodeId(
              path
            )}`
          );
        }
      } else {
        // e.g. import()
        // e.g. import('module1', 'module2')
        // unsupported
        // not possible
        throw new Error("Unsupported import statement.");
      }
    } else {
      // unsupported
      // no clue what this is
      throw new Error("Unsupported import statement.");
    }
  };

  public CallExpression: (path: NodePath<t.CallExpression>) => void = (
    path
  ) => {
    if ("name" in path.node.callee && path.node.callee.name === "require") {
      if (path.node.arguments[0].type === "StringLiteral") {
        this._imports.add(path.node.arguments[0].value);
      } else {
        // This tool does not support computed dynamic require statements.
        DependencyVisitor.LOGGER.warn(
          `This tool does not support computed dynamic require statements. Found one at ${this._getNodeId(
            path
          )}`
        );
      }
    }
  };

  get imports(): Set<string> {
    return this._imports;
  }
}
