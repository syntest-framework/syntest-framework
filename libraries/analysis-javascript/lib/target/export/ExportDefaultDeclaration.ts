/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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

import { Export } from "./Export";
import { ExportVisitor } from "./ExportVisitor";

export function extractExportsFromExportDefaultDeclaration(
  visitor: ExportVisitor,
  filePath: string,
  path: NodePath<t.ExportDefaultDeclaration>
): Export[] {
  let name: string;
  let id: string;

  const declaration = path.get("declaration");

  if (declaration.isIdentifier()) {
    name = declaration.node.name;
    id = visitor._getBindingId(declaration);
  } else if (declaration.isLiteral()) {
    name = "default";
    id = visitor._getNodeId(declaration);
  } else if (declaration.isNewExpression()) {
    if (declaration.node.callee.type !== "Identifier") {
      // unsupported
      throw new Error("Unsupported export default declaration");
    }
    name = declaration.node.callee.name;
    // idk if this is correct
    id = visitor._getNodeId(declaration);
  } else if (
    declaration.isFunctionDeclaration() ||
    declaration.isClassDeclaration()
  ) {
    name = declaration.node.id ? declaration.node.id.name : "default";
    id = visitor._getNodeId(declaration);
  } else if (declaration.isCallExpression()) {
    name = "default";
    id = visitor._getNodeId(declaration);
  } else if (declaration.isObjectExpression()) {
    const exports: Export[] = [];
    for (const property of declaration.get("properties")) {
      if (property.isObjectProperty()) {
        const key = property.get("key");
        const value = property.get("value");
        if (!key.isIdentifier()) {
          throw new Error("unsupported syntax");
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
  } else {
    // we could also put anon here, but that would be a bit weird
    //   name = "anonymous"
    // unsupported
    // examples which we don't support:
    // export default true
    // export default 1
    // export default "string"
    // export default {}
    // export default []
    // etc.
    throw new Error(
      `Unsupported export default declaration at ${visitor._getNodeId(path)}`
    );
  }

  return [
    {
      id: id,
      filePath,
      name: name,
      renamedTo: name,
      default: true,
      module: false,
    },
  ];
}
