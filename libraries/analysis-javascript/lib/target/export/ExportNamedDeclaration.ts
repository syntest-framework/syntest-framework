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

function extractFromObjectPattern(
  visitor: ExportVisitor,
  filePath: string,
  path: NodePath<t.ObjectPattern>,
  initPath: NodePath<t.Node>
): Export[] {
  const exports: Export[] = [];

  if (!initPath.isObjectExpression()) {
    // unsupported
    // e.g. export const {a} = o
    throw new Error("Property init is not an object expression");
  }

  if (path.get("properties").length !== initPath.get("properties").length) {
    // unsupported
    // e.g. export const {a, b} = {a: 1}
    // the number of properties in the object pattern should be the same as the number of properties in the object expression
    throw new Error(
      "Number of properties in object pattern and object expression do not match"
    );
  }

  const notIdentifier = "Property key is not an identifier";
  for (const property of path.get("properties")) {
    if (property.isRestElement()) {
      // unsupported
      // e.g. export const {a, ...b} = objectA
      // if we have a rest element, we bassically export all the properties of the rest element so it is not possible to know what is exported
      throw new Error("RestElement is not supported");
    }

    if (property.isObjectProperty()) {
      const key = property.get("key");
      if (!key.isIdentifier()) {
        // unsupported
        // not possible i think
        throw new Error(notIdentifier);
      }

      const propertyName = key.node.name;

      // find the property in the object expression that has the same name as the property in the object pattern
      const match = initPath.get("properties").find((_property) => {
        if (_property.node.type === "SpreadElement") {
          // unsupported
          // e.g. export const {a, b} = {a, ...o}
          // if we have a sperad element, we bassically export all the properties of the spread element so it is not possible to know what is exported
          throw new Error("SpreadElement is not supported");
        }

        if (_property.node.key.type !== "Identifier") {
          // unsupported
          // not possible i think
          throw new Error(notIdentifier);
        }

        // so we want to find the property that has the same name as the property in the object pattern
        // e.g. export const {a} = {a: 1}
        return _property.node.key.name === propertyName;
      });

      if (!match) {
        throw new Error("Property not found");
      }

      // stupid hack to make typescript happy (is already checked above)
      if (match.isSpreadElement()) {
        // unsupported
        // should never happen
        // if we have a sperad element, we bassically export all the properties of the spread element so it is not possible to know what is exported
        throw new Error("SpreadElement is not supported");
      }

      if (match.isObjectMethod()) {
        // unsupported
        // no idea what this is
        throw new Error("ObjectMethod is not supported");
      }

      if (!key.isIdentifier()) {
        // unsupported
        // should never happen
        throw new Error(notIdentifier);
      }

      if (match.isObjectProperty()) {
        if (match.node.value.type === "Identifier") {
          // if the value assigned is an identifier we rename the identifier
          // e.g. export const {a} = {a: b}
          // in the above example we rename b to a (as the export)

          // get the binding of the local variable b
          const bindingId = visitor._getBindingId(match.get("value"));

          exports.push({
            id: bindingId,
            filePath,
            name: match.node.value.name,
            renamedTo: key.node.name,
            default: false,
            module: false,
          });
        } else {
          // no rename, probably a literal
          // e.g. export const {a} = {a: 1}
          exports.push({
            id: visitor._getNodeId(match.get("value")),
            filePath,
            name: key.node.name,
            renamedTo: key.node.name,
            default: false,
            module: false,
          });
        }
      }
    }
  }
  return exports;
}

function extractFromArrayPattern(
  visitor: ExportVisitor,
  filePath: string,
  path: NodePath<t.ArrayPattern>,
  initPath: NodePath<t.Node>
): Export[] {
  const exports: Export[] = [];

  if (!initPath.isArrayExpression()) {
    // unsupported
    // e.g. export const [a] = o
    throw new Error("Property init is not an array expression");
  }

  if (path.get("elements").length !== initPath.get("elements").length) {
    // unsupported
    // e.g. export const [a, b] = [1]
    throw new Error("Array length does not match");
  }

  for (let index = 0; index < path.get("elements").length; index++) {
    const element = path.get("elements")[index];
    const initElement = initPath.get("elements")[index];

    if (!element.isIdentifier()) {
      // unsupported
      throw new Error("Array element is not an identifier");
    }

    if (initElement.isIdentifier()) {
      // if the value assigned is an identifier we rename the identifier
      // e.g. export const [a] = [b]
      // in the above example we rename b to a (as the export)

      // get the binding of the local name
      const bindingId = visitor._getBindingId(initElement);
      exports.push({
        id: bindingId,
        filePath,
        name: initElement.node.name,
        renamedTo: element.node.name,
        default: false,
        module: false,
      });
    } else {
      // no rename, probably a literal
      // e.g. export const [a] = [1]
      exports.push({
        id: visitor._getNodeId(initElement),
        filePath,
        name: element.node.name,
        renamedTo: element.node.name,
        default: false,
        module: false,
      });
    }
  }

  return exports;
}

export function extractExportsFromExportNamedDeclaration(
  visitor: ExportVisitor,
  filePath: string,
  path: NodePath<t.ExportNamedDeclaration>
): Export[] {
  const exports: Export[] = [];

  if (path.has("declaration")) {
    const declaration = path.get("declaration");

    if (
      declaration.isFunctionDeclaration() ||
      declaration.isClassDeclaration()
    ) {
      // export function x () =>
      // export class x () =>
      exports.push({
        id: visitor._getNodeId(declaration),
        filePath,
        name: declaration.node.id.name,
        renamedTo: declaration.node.id.name,
        default: false,
        module: false,
      });
    } else if (declaration.isVariableDeclaration()) {
      // export const x = ?
      for (const declaration_ of declaration.get("declarations")) {
        const id = declaration_.get("id");

        const init = declaration_.get("init");

        if (id.isIdentifier()) {
          // export const x = ?

          if (!declaration_.has("init")) {
            // export let x
            exports.push({
              id: visitor._getNodeId(declaration_),
              filePath: filePath,
              name: id.node.name,
              renamedTo: id.node.name,
              default: false,
              module: false,
            });
            continue;
          }

          if (init.isIdentifier()) {
            // export const x = a
            exports.push({
              id: visitor._getBindingId(init),
              filePath: filePath,
              name: init.node.name,
              renamedTo: id.node.name,
              default: false,
              module: false,
            });
          } else if (init.isLiteral()) {
            // export const x = 1
            exports.push({
              id: visitor._getNodeId(declaration_),
              filePath: filePath,
              name: id.node.name,
              renamedTo: id.node.name,
              default: false,
              module: false,
            });
          } else if (init.isFunction() || init.isClass()) {
            // export const x = () => {}
            // export const y = function () => {}
            // export const z = class {}
            exports.push({
              id: visitor._getNodeId(declaration_),
              filePath,
              name: init.has("id")
                ? (<NodePath<t.Identifier>>init.get("id")).node.name
                : id.node.name,
              renamedTo: id.node.name,
              default: false,
              module: false,
            });
          }
        } else if (id.isObjectPattern()) {
          // TODO verify that these work
          exports.push(
            ...extractFromObjectPattern(visitor, filePath, id, init)
          );
        } else if (id.isArrayPattern()) {
          // TODO verify that these work
          exports.push(...extractFromArrayPattern(visitor, filePath, id, init));
        } else {
          throw new Error("Unsupported declaration type");
        }
      }
    } else {
      // unsupported
      throw new Error("Unsupported declaration type");
    }
  } else if (path.node.specifiers) {
    for (const specifierPath of path.get("specifiers")) {
      if (specifierPath.isExportSpecifier()) {
        // e.g. export {a as b}
        // e.g. export {a as "b"}
        // e.g. export {a}
        // get the binding of the local name
        const bindingId = visitor._getBindingId(specifierPath.get("local"));

        exports.push({
          id: bindingId,
          filePath,
          name: specifierPath.node.local.name,
          renamedTo:
            specifierPath.node.exported.type === "Identifier"
              ? specifierPath.node.exported.name
              : specifierPath.node.exported.value,
          default: false,
          module: false,
        });
      } else {
        // unsupported
        throw new Error("Unsupported specifier type");
      }
    }
  } else {
    // unsupported
    throw new Error("Export has no specifiers nor declarations");
  }

  return exports;
}
