/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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
import { ImplementationError } from "@syntest/diagnostics";
import { getLogger } from "@syntest/logging";

import { Export } from "./Export";
import { ExportVisitor } from "./ExportVisitor";

export function extractExportsFromExportDefaultDeclaration(
  visitor: ExportVisitor,
  filePath: string,
  path: NodePath<t.ExportDefaultDeclaration>
): Export[] {
  const declaration = path.get("declaration");
  return extractExportFromDeclaration(visitor, filePath, declaration);
}

function extractExportFromDeclaration(
  visitor: ExportVisitor,
  filePath: string,
  declaration: NodePath<
    | t.TSDeclareFunction
    | t.FunctionDeclaration
    | t.ClassDeclaration
    | t.Expression
  >
): Export[] {
  if (declaration.isIdentifier()) {
    // export default x
    return [
      {
        id: visitor._getBindingId(declaration),
        filePath,
        name: declaration.node.name,
        renamedTo: declaration.node.name,
        default: true,
        module: false,
      },
    ];
  } else if (declaration.isLiteral() || declaration.isCallExpression()) {
    // export default 1
    // export default "abc"
    // export default true

    // export default x()

    return [
      {
        id: visitor._getNodeId(declaration),
        filePath,
        name: "default",
        renamedTo: "default",
        default: true,
        module: false,
      },
    ];
  } else if (declaration.isNewExpression()) {
    // export default new Class()

    if (declaration.node.callee.type !== "Identifier") {
      // unsupported
      throw new ImplementationError("Unsupported export default declaration");
    }
    return [
      {
        // idk if this is correct
        id: visitor._getNodeId(declaration),
        filePath,
        name: declaration.node.callee.name,
        renamedTo: declaration.node.callee.name,
        default: true,
        module: false,
      },
    ];
  } else if (
    declaration.isFunctionDeclaration() ||
    declaration.isClassDeclaration()
  ) {
    // export default function () {}
    // export default class {}
    const name = declaration.node.id ? declaration.node.id.name : "default";
    return [
      {
        id: visitor._getNodeId(declaration),
        filePath,
        name: name,
        renamedTo: name,
        default: true,
        module: false,
      },
    ];
  } else if (declaration.isObjectExpression()) {
    // export default {}
    const exports: Export[] = [];
    for (const property of declaration.get("properties")) {
      if (property.isObjectProperty()) {
        const key = property.get("key");
        const value = property.get("value");
        if (!key.isIdentifier()) {
          throw new ImplementationError("unsupported syntax");
        }
        exports.push({
          id: visitor._getBindingId(value),
          filePath,
          name: value.isIdentifier() ? value.node.name : key.node.name,
          renamedTo: key.node.name,
          default: false,
          module: false,
        });
      }
    }

    return exports;
  } else if (declaration.isLogicalExpression()) {
    return [
      ...extractExportFromDeclaration(
        visitor,
        filePath,
        declaration.get("left")
      ),
      ...extractExportFromDeclaration(
        visitor,
        filePath,
        declaration.get("right")
      ),
    ];
  }

  // we could also put anon here, but that would be a bit weird
  //   name = "anonymous"
  // unsupported
  // examples which we don't support:
  // export default []
  // etc.
  getLogger("ExportDefaultDeclaration").warn(
    `Unsupported export default declaration at ${visitor._getNodeId(
      declaration
    )}`
  );
  return [];
}
