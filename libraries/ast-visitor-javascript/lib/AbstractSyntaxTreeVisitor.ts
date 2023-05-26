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
import { Scope as BabelScope, TraverseOptions } from "@babel/traverse";
import * as t from "@babel/types";

import { getLogger, Logger } from "@syntest/logging";
import * as globals from "globals";

const flatGlobals = new Set(
  Object.values(globals).flatMap((value) => Object.keys(value))
);
const reservedKeywords = new Set([
  "abstract",
  "arguments",
  "await*",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class*",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "double",
  "else",
  "enum*",
  "eval",
  "export*",
  "extends*",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "function",
  "goto",
  "if",
  "implements",
  "import*",
  "in",
  "instanceof",
  "int",
  "interface",
  "let*",
  "long",
  "native",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "super*",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "volatile",
  "while",
  "with",
  "yield",
]);
export class AbstractSyntaxTreeVisitor implements TraverseOptions {
  protected static LOGGER: Logger;

  protected _filePath: string;

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

  get scopeIdOffset() {
    return this._scopeIdOffset;
  }

  constructor(filePath: string) {
    this._filePath = filePath;
    AbstractSyntaxTreeVisitor.LOGGER = getLogger("AbstractSyntaxTreeVisitor");
  }

  protected _getUidFromScope(scope: BabelScope): number {
    return (<{ uid: number }>(<unknown>scope))["uid"];
  }

  public _getNodeId(path: NodePath<t.Node>): string {
    if (path.node.loc === undefined) {
      throw new Error(
        `Node ${path.type} in file '${this._filePath}' does not have a location`
      );
    }

    const startLine = (<{ line: number }>(<unknown>path.node.loc.start)).line;
    const startColumn = (<{ column: number }>(<unknown>path.node.loc.start))
      .column;
    const startIndex = (<{ index: number }>(<unknown>path.node.loc.start))
      .index;
    const endLine = (<{ line: number }>(<unknown>path.node.loc.end)).line;
    const endColumn = (<{ column: number }>(<unknown>path.node.loc.end)).column;
    const endIndex = (<{ index: number }>(<unknown>path.node.loc.end)).index;

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
      AbstractSyntaxTreeVisitor.LOGGER.info(`Unsupported labeled statement`);
      throw new Error("Cannot get binding for labeled statement");
    }

    if (
      path.parentPath.isMemberExpression() &&
      path.parentPath.get("property") === path
    ) {
      // we are the property of a member expression
      // so the binding id is equal to the object of the member expression relation + the id of the property
      // e.g. bar.foo
      return (
        this._getBindingId(path.parentPath.get("object")) +
        " <-> " +
        this._getNodeId(path)
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
      (flatGlobals.has(path.node.name) || reservedKeywords.has(path.node.name))
    ) {
      return `global::${path.node.name}`;
    } else if (binding === undefined) {
      throw new Error(
        `Cannot find binding for ${path.node.name} at ${this._getNodeId(path)}`
      );
    } else {
      return this._getNodeId(binding.path);
    }
  }

  public _getThisParent(
    path: NodePath<t.Node>
  ): NodePath<
    t.FunctionDeclaration | t.FunctionExpression | t.ObjectMethod | t.Class
  > {
    let parent = path.getFunctionParent();

    if (parent === undefined || parent === null) {
      throw new Error("ThisExpression must be inside a function");
    }

    while (parent.isArrowFunctionExpression()) {
      // arrow functions are not thisable
      parent = parent.getFunctionParent();

      if (parent === undefined || parent === null) {
        throw new Error("ThisExpression must be inside a function");
      }
    }

    if (parent.isClassMethod() || parent.isClassPrivateMethod()) {
      const classParent = path.findParent((p) => p.isClass());
      if (classParent === undefined || classParent === null) {
        throw new Error("ThisExpression must be inside a class");
      }
      return <NodePath<t.Class>>classParent;
    }

    if (
      parent.isFunctionDeclaration() ||
      parent.isFunctionExpression() ||
      parent.isObjectMethod()
    ) {
      return parent;
    }

    throw new Error("ThisExpression must be inside a function");
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

  // protected _getCurrentThisScopeName() {
  //   if (this._thisScopeStackNames.length === 0) {
  //     throw new Error("Invalid scope stack!");
  //   }

  //   return this._thisScopeStackNames[this._thisScopeStackNames.length - 1];
  // }

  protected _getNameFromNode(node: t.Node): string {
    if (node.type === "Identifier") {
      return node.name;
    }

    if ("name" in node) {
      if (typeof node.name === "string") {
        return node.name;
      } else if (node.name.type === "JSXMemberExpression") {
        return "anon";
      } else if (node.name.type === "JSXNamespacedName") {
        return node.name.name.name;
      } else {
        return node.name.name;
      }
    }

    return "anon";
  }
}
