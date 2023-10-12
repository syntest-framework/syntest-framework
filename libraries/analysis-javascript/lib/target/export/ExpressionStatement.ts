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
import { getLogger } from "@syntest/logging";

import { Export } from "./Export";
import { ExportVisitor } from "./ExportVisitor";

export type PartialExport = PartialDefaultExport | PartialNonDefaultExport;

type PartialDefaultExport = {
  default: true;
};

type PartialNonDefaultExport = {
  default: false;
  renamedTo: string;
};

export function extractExportsFromAssignmentExpression(
  visitor: ExportVisitor,
  filePath: string,
  path_: NodePath<t.AssignmentExpression>
): Export[] {
  const left = path_.get("left");
  const right = path_.get("right");

  let partialExport: PartialExport | false = checkExportAndDefault(
    visitor,
    left
  );

  if (partialExport) {
    return extractExportsFromLeftAssignmentExpression(
      visitor,
      filePath,
      partialExport,
      right
    );
  }

  if (left.isLVal()) {
    partialExport = checkExportAndDefault(visitor, right);

    if (partialExport) {
      return extractExportsFromRightAssignmentExpression(
        visitor,
        filePath,
        left,
        partialExport
      );
    }
  } else {
    // no clue
  }

  return [];
}

export function extractExportsFromRightAssignmentExpression(
  visitor: ExportVisitor,
  filePath: string,
  left: NodePath<t.LVal | t.Identifier>,
  right: PartialExport
): Export[] {
  const exports: Export[] = [];

  const module = true;

  const id = visitor._getBindingId(left);
  const name = getName(left);
  if (right.default) {
    exports.push({
      id: id,
      filePath: filePath,
      name: name,
      renamedTo: name, // actually renamed to nothing aka default but we keep the name
      default: right.default,
      module: module,
    });
  } else {
    exports.push({
      id: id,
      filePath: filePath,
      name:
        name === "default" ? (<PartialNonDefaultExport>right).renamedTo : name,
      renamedTo: (<PartialNonDefaultExport>right).renamedTo,
      default: right.default,
      module: module,
    });
  }

  console.log(exports);
  return exports;
}

export function extractExportsFromLeftAssignmentExpression(
  visitor: ExportVisitor,
  filePath: string,
  left: PartialExport,
  right: NodePath<t.Expression>
): Export[] {
  const exports: Export[] = [];

  const module = true;

  if (left.default && right.isObjectExpression()) {
    // module.exports = {...}
    // exports = {...}
    // so not default actually
    // extract the stuff from the object
    const properties = right.get("properties");
    exports.push(
      ...extractObjectProperties(right, properties, visitor, filePath, module)
    );
  } else if (left.default) {
    // module.exports = ?
    // exports = ?
    // but ? is not an object expression
    const id = visitor._getBindingId(right);
    const name = getName(right);
    exports.push({
      id: id,
      filePath: filePath,
      name: name,
      renamedTo: name, // actually renamed to nothing aka default but we keep the name
      default: left.default,
      module: module,
    });
  } else {
    // module.exports.? = ?
    // exports.? = ?
    // ? can be object but we dont care since it is not a default export
    const id = visitor._getBindingId(right);
    const name = getName(right);
    exports.push({
      id: id,
      filePath: filePath,
      name:
        name === "default" ? (<PartialNonDefaultExport>left).renamedTo : name,
      renamedTo: (<PartialNonDefaultExport>left).renamedTo,
      default: left.default,
      module: module,
    });
  }

  return exports;
}

export function extractObjectProperties(
  path: NodePath<t.Node>,
  properties: NodePath<t.ObjectMethod | t.ObjectProperty | t.SpreadElement>[],
  visitor: ExportVisitor,
  filePath: string,
  module: boolean
): Export[] {
  const default_ = false;
  const exports: Export[] = [];
  for (const property of properties) {
    if (property.isObjectMethod()) {
      // {a () {}}
      const key = property.get("key");
      if (!key.isIdentifier()) {
        // e.g. exports = { () {} }
        // unsupported
        // not possible i think
        throw new Error("Unsupported export declaration");
      }

      exports.push({
        id: visitor._getNodeId(property),
        filePath: filePath,
        name: key.node.name,
        renamedTo: key.node.name,
        default: default_,
        module: module,
      });
    } else if (property.isObjectProperty()) {
      // {a: b}
      const key = property.get("key");
      const value = property.get("value");

      let keyName: string;
      if (
        key.isStringLiteral() ||
        key.isNumericLiteral() ||
        key.isBooleanLiteral() ||
        key.isBigIntLiteral()
      ) {
        // e.g. exports = { "a": ? }
        // e.g. exports = { 1: ? }
        // e.g. exports = { true: ? }
        keyName = String(key.node.value);
      } else if (key.isIdentifier()) {
        // e.g. exports = { a: ? }
        keyName = key.node.name;
      } else {
        // e.g. exports = { ?: ? }
        // unsupported
        throw new Error("Unsupported export declaration");
      }

      if (value.isIdentifier()) {
        // e.g. exports = { a: b }
        exports.push({
          id: visitor._getBindingId(value),
          filePath,
          name: value.node.name,
          renamedTo: keyName,
          default: default_,
          module: module,
        });
      } else {
        // e.g. exports = { a: 1 }
        exports.push({
          id: visitor._getBindingId(value),
          filePath,
          name: keyName,
          renamedTo: keyName,
          default: default_,
          module: module,
        });
      }
    } else {
      // {...a}
      // unsupported
      if (visitor.syntaxForgiving) {
        // Log it
        getLogger("ExportVisitor").warn(
          `Unsupported export declaration at ${visitor._getNodeId(path)}`
        );
      } else {
        throw new Error(
          `Unsupported export declaration at ${visitor._getNodeId(path)}`
        );
      }
    }
  }
  return exports;
}

export function getName(
  expression: NodePath<t.Expression | t.LVal | t.Identifier>
): string {
  if (expression.isIdentifier()) {
    return expression.node.name;
  }

  if (
    expression.isLiteral() ||
    expression.isArrayExpression() ||
    expression.isObjectExpression()
  ) {
    return expression.type;
  }

  if (expression.isFunction() || expression.isClass()) {
    if (!expression.has("id")) {
      return expression.isFunction() ? "anonymousFunction" : "anonymousClass";
    }
    const id = expression.get("id");

    // must be identifier type if it is a nodepath
    return (<NodePath<t.Identifier>>id).node.name;
  }

  return "default";
}

export function checkExportAndDefault(
  visitor: ExportVisitor,
  expression: NodePath<t.LVal | t.Expression>
): false | PartialExport {
  if (expression.isIdentifier() && expression.node.name === "exports") {
    // exports
    return { default: true };
  } else if (expression.isMemberExpression()) {
    // ?.?
    const object = expression.get("object");
    const property = expression.get("property");

    if (object.isIdentifier()) {
      // ?.?
      if (object.node.name === "module") {
        if (
          (!expression.node.computed &&
            property.isIdentifier() &&
            property.node.name === "exports") ||
          (expression.node.computed &&
            property.isStringLiteral() &&
            property.node.value === "exports")
        ) {
          // module.exports
          // module['exports']
          return { default: true };
        } else {
          // module[exports]
          // TODO replace by logger
          console.warn(`Unsupported syntax 'module[x] = ?'`);
        }
      } else if (object.node.name === "exports") {
        // exports.?
        const name = _getNameOfProperty(
          visitor,
          property,
          expression.node.computed
        );
        if (!name) {
          return false;
        }
        return {
          default: false,
          renamedTo: name,
        };
      }
    } else if (object.isMemberExpression()) {
      // ?.?.?
      const subObject = object.get("object");
      const subProperty = object.get("property");

      if (
        subObject.isIdentifier() &&
        subObject.node.name === "module" &&
        ((!object.node.computed &&
          subProperty.isIdentifier() &&
          subProperty.node.name === "exports") ||
          (object.node.computed &&
            subProperty.isStringLiteral() &&
            subProperty.node.value === "exports"))
      ) {
        // module.exports.?
        // module['exports'].?
        // module.exports[?]
        const name = _getNameOfProperty(
          visitor,
          property,
          expression.node.computed
        );
        if (!name) {
          return false;
        }
        return {
          default: false,
          renamedTo: name,
        };
      }
    }
  }

  return false;
}

function _getNameOfProperty(
  visitor: ExportVisitor,
  property: NodePath<t.PrivateName | t.Expression>,
  computed: boolean
): string | undefined {
  if (computed) {
    // module.exports[?] = ?
    if (
      property.isStringLiteral() ||
      property.isNumericLiteral() ||
      property.isBooleanLiteral() ||
      property.isBigIntLiteral()
    ) {
      // module.exports['x'] = ?
      return String(property.node.value);
    } else {
      // module.exports[a] = ?
      getLogger("ExportVisitor").warn(
        `This tool does not support computed export statements. Found one at ${visitor._getNodeId(
          property
        )}`
      );
      return undefined;
    }
  } else if (property.isIdentifier()) {
    // module.exports.x = ?
    return property.node.name;
  } else {
    // module.exports.? = ?
    throw new Error('Unsupported syntax "module.exports.? = ?"');
  }
}
