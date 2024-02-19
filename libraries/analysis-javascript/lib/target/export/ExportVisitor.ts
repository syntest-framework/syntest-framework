/*
 * Copyright 2020-2023 SynTest contributors
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
import {
  checkExportAndDefault,
  extractExportsFromAssignmentExpression,
  extractExportsFromLeftAssignmentExpression,
  extractExportsFromRightAssignmentExpression,
  PartialExport,
} from "./ExpressionStatement";

export class ExportVisitor extends AbstractSyntaxTreeVisitor {
  private _exports: Export[];

  constructor(filePath: string, syntaxForgiving: boolean) {
    super(filePath, syntaxForgiving);
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
      ...extractExportsFromExportDefaultDeclaration(this, this.filePath, path)
    );
  };

  // e.g. module.exports = ...
  // e.g. exports.foo = ...
  // e.g. ... = exports
  // e.g. ... = module.exports
  public AssignmentExpression: (
    path: NodePath<t.AssignmentExpression>
  ) => void = (path) => {
    const exports = extractExportsFromAssignmentExpression(
      this,
      this.filePath,
      path
    );
    this._exports.push(...exports);
  };

  // e.g. let x = module.exports
  // e.g. let x = exports.foo
  public VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => void = (
    path_
  ) => {
    const id = path_.get("id");
    const init = path_.get("init");

    let partialExport: PartialExport | false = checkExportAndDefault(this, id);

    if (partialExport) {
      this._exports.push(
        ...extractExportsFromLeftAssignmentExpression(
          this,
          this.filePath,
          partialExport,
          init
        )
      );
      return;
    }

    partialExport = checkExportAndDefault(this, init);

    if (partialExport) {
      this._exports.push(
        ...extractExportsFromRightAssignmentExpression(
          this,
          this.filePath,
          id,
          partialExport
        )
      );
    }
  };

  // getters
  get exports(): Export[] {
    return this._exports;
  }
}
