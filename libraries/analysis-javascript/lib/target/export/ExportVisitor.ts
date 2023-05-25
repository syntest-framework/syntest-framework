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

import { Export } from "./Export";
import { extractExportsFromExportDefaultDeclaration } from "./ExportDefaultDeclaration";
import { extractExportsFromExportNamedDeclaration } from "./ExportNamedDeclaration";
import { extractExportsFromExpressionStatement } from "./ExpressionStatement";

export class ExportVisitor extends AbstractSyntaxTreeVisitor {
  private _exports: Export[];

  constructor(filePath: string) {
    super(filePath);
    this._exports = [];
  }

  // e.g. export { foo, bar }
  public ExportNamedDeclaration: (
    path: NodePath<t.ExportNamedDeclaration>
  ) => void = (path) => {
    if (path.node.source) {
      // this means that the export comes from another module
      // we skip this because we already cover those through the original exporting module
      return;
    }

    this._exports.push(
      ...extractExportsFromExportNamedDeclaration(this, this.filePath, path)
    );
  };

  // e.g. export default foo
  public ExportDefaultDeclaration: (
    path: NodePath<t.ExportDefaultDeclaration>
  ) => void = (path) => {
    this._exports.push(
      extractExportsFromExportDefaultDeclaration(this, this.filePath, path)
    );
  };

  // e.g. module.exports = ...
  // e.g. exports.foo = ...
  public ExpressionStatement: (path: NodePath<t.ExpressionStatement>) => void =
    (path) => {
      if (path.node.expression.type !== "AssignmentExpression") {
        return;
      }

      const exports = extractExportsFromExpressionStatement(
        this,
        this.filePath,
        path
      );
      if (exports) {
        this._exports.push(...exports);
      }
    };

  // getters
  get exports(): Export[] {
    return this._exports;
  }
}
