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
): Export {
  let name: string;
  let id: string;

  switch (path.node.declaration.type) {
    case "Identifier": {
      name = path.node.declaration.name;
      id = visitor._getBindingId(path.get("declaration"));
      break;
    }
    case "NewExpression": {
      if (path.node.declaration.callee.type !== "Identifier") {
        // unsupported
        throw new Error("Unsupported export default declaration");
      }
      name = path.node.declaration.callee.name;
      // idk if this is correct
      id = visitor._getNodeId(path.get("declaration"));

      break;
    }
    case "FunctionDeclaration":
    case "ClassDeclaration": {
      name = path.node.declaration.id
        ? path.node.declaration.id.name
        : "default";
      id = visitor._getNodeId(path.get("declaration"));
      break;
    }
    default: {
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
      throw new Error("Unsupported export default declaration");
    }
  }

  return {
    id: id,
    filePath,
    name: name,
    renamedTo: name,
    default: true,
    module: false,
  };
}
