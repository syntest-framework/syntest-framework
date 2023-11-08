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
import { Scope as BabelScope, TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";
import { getLogger, Logger } from "@syntest/logging";

import { globalVariables } from "./globalVariables";
import { reservedKeywords } from "./reservedKeywords";

export const MemberSeparator = " <-> ";

export class AbstractSyntaxTreeVisitor implements TraverseOptions {
  [k: `${string}|${string}`]: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    path: NodePath<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: any
  ) => void;

  protected static LOGGER: Logger;

  protected _filePath: string;

  protected _syntaxForgiving: boolean;

  protected _scopeIdOffset: number;

  protected _thisScopes: Set<string> = new Set([
    "ClassDeclaration",
    "FunctionDeclaration",
  ]);
  protected _thisScopeStack: number[] = [];
  protected _thisScopeStackNames: string[] = [];

  get filePath() {
    return this._filePath;
  }

  get syntaxForgiving() {
    return this._syntaxForgiving;
  }

  get scopeIdOffset() {
    return this._scopeIdOffset;
  }

  constructor(filePath: string, syntaxForgiving: boolean) {
    AbstractSyntaxTreeVisitor.LOGGER = getLogger("AbstractSyntaxTreeVisitor");
    this._filePath = filePath;
    this._syntaxForgiving = syntaxForgiving;
  }

  protected _getUidFromScope(scope: BabelScope): number {
    return (<{ uid: number }>(<unknown>scope))["uid"];
  }

  public _getNodeId(path: NodePath<t.Node> | t.Node): string {
    const loc = "node" in path ? path.node.loc : path.loc;
    if (loc === undefined) {
      throw new Error(
        `Node ${path.type} in file '${this._filePath}' does not have a location`
      );
    }

    const startLine = (<{ line: number }>(<unknown>loc.start)).line;
    const startColumn = (<{ column: number }>(<unknown>loc.start)).column;
    const startIndex = (<{ index: number }>(<unknown>loc.start)).index;
    const endLine = (<{ line: number }>(<unknown>loc.end)).line;
    const endColumn = (<{ column: number }>(<unknown>loc.end)).column;
    const endIndex = (<{ index: number }>(<unknown>loc.end)).index;

    return `${this._filePath}:${startLine}:${startColumn}:::${endLine}:${endColumn}:::${startIndex}:${endIndex}`;
  }

  public _getBindingId(path: NodePath<t.Node>): string {
    if (
      path.parentPath.isLabeledStatement() &&
      path.parentPath.get("label") === path
    ) {
      /**
       * e.g.
       * foo:
       * while (true) {
       *   a = 2
       *  continue foo
       * }
       */
      // not supported
      if (this.syntaxForgiving) {
        AbstractSyntaxTreeVisitor.LOGGER.warn(
          `Unsupported labeled statement found at ${this._getNodeId(path)}`
        );
        return this._getNodeId(path);
      } else {
        throw new Error("Cannot get binding for labeled statement");
      }
    }

    if (
      path.parentPath.isMemberExpression() &&
      path.parentPath.get("property") === path
    ) {
      // we are the property of a member expression
      // so the binding id is equal to the object of the member expression relation + the id of the property
      // e.g. bar.foo
      if (
        !path.isIdentifier() &&
        !path.isStringLiteral() &&
        !path.isNumericLiteral()
      ) {
        return this._getNodeId(path);
      }
      return (
        this._getBindingId(path.parentPath.get("object")) +
        MemberSeparator +
        (path.isIdentifier() ? path.node.name : `${path.node.value}`)
        // this._getNodeId(path) // bad
      );
    }

    if (
      path.parentPath.isClassMethod() &&
      path.parentPath.get("key") === path
    ) {
      // we are the key of a class method
      // so this is the first definition of foo
      // e.g. class Foo { foo() {} }
      return this._getNodeId(path);
    }

    if (
      (path.parentPath.isObjectProperty() ||
        path.parentPath.isObjectMethod()) &&
      path.parentPath.get("key") === path
    ) {
      // we are the key of an object property/method
      // so this is the first definition of foo
      // e.g. { foo: bar }
      return this._getNodeId(path);
    }

    if (
      path.parentPath.isImportSpecifier() &&
      path.parentPath.node.local.name !==
        ("name" in path.parentPath.node.imported
          ? path.parentPath.node.imported.name
          : path.parentPath.node.imported.value)
    ) {
      // we import and rename
      // so this is the first definition of foo
      // e.g. import { foo as bar } from "./bar"
      return this._getNodeId(path);
    }

    if (
      path.parentPath.isExportSpecifier() &&
      path.parentPath.get("exported") === path
    ) {
      // we are the export name of a renamed export
      // so this is the first definition of foo
      // e.g. export {bar as foo}
      return this._getNodeId(path);
    }

    if (
      path.parentPath.isExportSpecifier() &&
      path.parentPath.parentPath.has("source")
    ) {
      // we export from source
      // so this is the first definition of foo
      // e.g. export { foo } from "./bar"
      return this._getNodeId(path);
    }

    if (!path.isIdentifier()) {
      // non identifier so we get the relation id
      return this._getNodeId(path);
    }

    const binding = path.scope.getBinding(path.node.name);

    if (
      binding === undefined &&
      (globalVariables.has(path.node.name) ||
        reservedKeywords.has(path.node.name))
    ) {
      return `global::${path.node.name}`;
    } else if (binding === undefined) {
      if (this.syntaxForgiving) {
        AbstractSyntaxTreeVisitor.LOGGER.warn(
          `Cannot find binding for ${path.node.name} at ${this._getNodeId(
            path
          )}`
        );
        return this._getNodeId(path);
      } else {
        throw new Error(
          `Cannot find binding for ${path.node.name} at ${this._getNodeId(
            path
          )}`
        );
      }
    } else {
      return this._getNodeId(binding.path);
    }
  }

  public _getThisParent(
    path: NodePath<t.Node>
  ): NodePath<
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ObjectExpression
    | t.Class
    | t.Program
  > {
    let parent = path.getFunctionParent();

    if (parent === undefined || parent === null) {
      if (this.syntaxForgiving) {
        AbstractSyntaxTreeVisitor.LOGGER.warn(
          `ThisExpression without parent function found at ${this._getNodeId(
            path
          )}`
        );
        return undefined; // <NodePath<t.Program>>path.findParent((p) => p.isProgram());
      } else {
        throw new Error(
          `ThisExpression without parent function found at ${this._getNodeId(
            path
          )}`
        );
      }
    }

    while (parent.isArrowFunctionExpression()) {
      // arrow functions are not thisable
      parent = parent.getFunctionParent();

      if (parent === undefined || parent === null) {
        if (this.syntaxForgiving) {
          AbstractSyntaxTreeVisitor.LOGGER.warn(
            `ThisExpression without parent function found at ${this._getNodeId(
              path
            )}`
          );
          return undefined; // <NodePath<t.Program>>path.findParent((p) => p.isProgram());
        } else {
          throw new Error(
            `ThisExpression without parent function found at ${this._getNodeId(
              path
            )}`
          );
        }
      }
    }

    if (parent.isClassMethod() || parent.isClassPrivateMethod()) {
      const classParent = path.findParent((p) => p.isClass());
      if (classParent === undefined || classParent === null) {
        // impossible?
        throw new Error(
          `ThisExpression without parent class found at ${this._getNodeId(
            path
          )}`
        );
      }
      return <NodePath<t.Class>>classParent;
    }

    if (parent.isObjectMethod()) {
      const objectParent = path.findParent((p) => p.isObjectExpression());
      if (objectParent === undefined || objectParent === null) {
        // impossible?
        throw new Error(
          `ThisExpression without parent object found at ${this._getNodeId(
            path
          )}`
        );
      }
      return <NodePath<t.ObjectExpression>>objectParent;
    }

    if (parent.isFunctionDeclaration() || parent.isFunctionExpression()) {
      return parent;
    }

    throw new Error(
      `ThisExpression without parent function found at ${this._getNodeId(path)}`
    );
  }

  enter = (path: NodePath<t.Node>) => {
    AbstractSyntaxTreeVisitor.LOGGER.silly(
      `Visiting node ${path.type} in file '${this._filePath}': location: ${path.node.loc?.start.line}:${path.node.loc?.start.column} - ${path.node.loc?.end.line}:${path.node.loc?.end.column} - type: ${path.node.type}`
    );
  };

  exit = (path: NodePath<t.Node>) => {
    AbstractSyntaxTreeVisitor.LOGGER.silly(
      `Exiting node ${path.type} in file '${this._filePath}': location: ${path.node.loc?.start.line}:${path.node.loc?.start.column} - ${path.node.loc?.end.line}:${path.node.loc?.end.column} - type: ${path.node.type}`
    );
  };

  public Program: (path: NodePath<t.Program>) => void = (path) => {
    if (this._scopeIdOffset === undefined) {
      this._scopeIdOffset = this._getUidFromScope(path.scope);
      this._thisScopeStack.push(this._getUidFromScope(path.scope));
      this._thisScopeStackNames.push("global");
    }
  };

  Scopable = {
    enter: (path: NodePath<t.Scopable>) => {
      if (!this._thisScopes.has(path.node.type)) {
        return;
      }

      if (!("id" in path.node)) {
        return;
      }

      let id = "anonymous";

      if (path.node.id !== null) {
        id = path.node.id.name;
      }

      const uid = this._getUidFromScope(path.scope);
      this._thisScopeStack.push(uid);
      this._thisScopeStackNames.push(id);
    },
    exit: (path: NodePath<t.Scopable>) => {
      if (!this._thisScopes.has(path.node.type)) {
        return;
      }

      this._thisScopeStack.pop();
      this._thisScopeStackNames.pop();
    },
  };

  protected _getCurrentThisScopeId() {
    if (this._thisScopeStack.length === 0) {
      throw new Error("Invalid scope stack!");
    }

    return this._thisScopeStack[this._thisScopeStack.length - 1];
  }
}
