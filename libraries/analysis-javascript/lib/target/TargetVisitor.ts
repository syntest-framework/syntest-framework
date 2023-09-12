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
import { TargetType } from "@syntest/analysis";
import { AbstractSyntaxTreeVisitor } from "@syntest/ast-visitor-javascript";

import {
  Callable,
  ClassTarget,
  Exportable,
  FunctionTarget,
  MethodTarget,
  NamedSubTarget,
  ObjectFunctionTarget,
  ObjectTarget,
  SubTarget,
} from "./Target";
import { Export } from "./export/Export";
import { unsupportedSyntax } from "../utils/diagnostics";
import { getLogger, Logger } from "@syntest/logging";

const COMPUTED_FLAG = ":computed:";
export class TargetVisitor extends AbstractSyntaxTreeVisitor {
  protected static override LOGGER: Logger;

  private _exports: Export[];

  private _subTargets: SubTarget[];

  constructor(filePath: string, syntaxForgiving: boolean, exports: Export[]) {
    super(filePath, syntaxForgiving);
    TargetVisitor.LOGGER = getLogger("TargetVisitor");
    this._exports = exports;
    this._subTargets = [];
  }

  private _getExport(id: string): Export | undefined {
    return this._exports.find((x) => {
      return x.id === id;
    });
  }

  private _getTargetNameOfDeclaration(
    path: NodePath<t.FunctionDeclaration | t.ClassDeclaration>
  ): string {
    if (path.node.id === null) {
      if (path.parentPath.node.type === "ExportDefaultDeclaration") {
        // e.g. export default class {}
        // e.g. export default function () {}
        return "default";
      } else {
        // e.g. class {}
        // e.g. function () {}
        // Should not be possible
        throw new Error("unknown class declaration");
      }
    } else {
      // e.g. class x {}
      // e.g. function x() {}
      return path.node.id.name;
    }
  }

  /**
   * Get the target name of an expression
   * The variable the expression is assigned to is used as the target name
   * @param path
   * @returns
   */
  private _getTargetNameOfExpression(path: NodePath<t.Node>): string {
    // e.g. const x = class A {}
    // e.g. const x = function A {}
    // e.g. const x = () => {}
    // we always use x as the target name instead of A
    const parentNode = path.parentPath.node;
    switch (parentNode.type) {
      case "ClassProperty": {
        // e.g. class A { ? = class {} }
        // e.g. class A { ? = function () {} }
        // e.g. class A { ? = () => {} }

        if (parentNode.key.type === "Identifier") {
          // e.g. class A { x = class {} }
          // e.g. class A { x = function () {} }
          // e.g. class A { x = () => {} }
          return parentNode.key.name;
        } else if (parentNode.key.type.includes("Literal")) {
          // e.g. class A { "x" = class {} }
          // e.g. class A { "x" = function () {} }
          // e.g. class A { "x" = () => {} }
          return "value" in parentNode.key
            ? parentNode.key.value.toString()
            : "null";
        } else {
          // e.g. const {x} = class {}
          // e.g. const {x} = function {}
          // e.g. const {x} = () => {}
          // Should not be possible
          throw new Error(
            unsupportedSyntax(path.node.type, this._getNodeId(path))
          );
        }
      }
      case "VariableDeclarator": {
        // e.g. const ?? = class {}
        // e.g. const ?? = function {}
        // e.g. const ?? = () => {}
        if (parentNode.id.type === "Identifier") {
          // e.g. const x = class {}
          // e.g. const x = function {}
          // e.g. const x = () => {}
          return parentNode.id.name;
        } else {
          // e.g. const {x} = class {}
          // e.g. const {x} = function {}
          // e.g. const {x} = () => {}
          // Should not be possible
          throw new Error(
            unsupportedSyntax(path.node.type, this._getNodeId(path))
          );
        }
      }
      case "AssignmentExpression": {
        // e.g. ?? = class {}
        // e.g. ?? = function {}
        // e.g. ?? = () => {}
        const assigned = parentNode.left;
        if (assigned.type === "Identifier") {
          // could also be memberexpression
          // e.g. x = class {}
          // e.g. x = function {}
          // e.g. x = () => {}
          return assigned.name;
        } else if (assigned.type === "MemberExpression") {
          // e.g. x.? = class {}
          // e.g. x.? = function {}
          // e.g. x.? = () => {}
          if (assigned.computed === true) {
            if (assigned.property.type.includes("Literal")) {
              // e.g. x["y"] = class {}
              // e.g. x["y"] = function {}
              // e.g. x["y"] = () => {}
              return "value" in assigned.property
                ? assigned.property.value.toString()
                : "null";
            } else {
              // e.g. x[y] = class {}
              // e.g. x[y] = function {}
              // e.g. x[y] = () => {}
              // TODO unsupported cannot get the name unless executing
              TargetVisitor.LOGGER.warn(
                `This tool does not support computed property assignments. Found one at ${this._getNodeId(
                  path
                )}`
              );
              return COMPUTED_FLAG;
            }
          } else if (assigned.property.type === "Identifier") {
            // e.g. x.y = class {}
            // e.g. x.y = function {}
            // e.g. x.y = () => {}
            if (
              assigned.property.name === "exports" &&
              assigned.object.type === "Identifier" &&
              assigned.object.name === "module"
            ) {
              // e.g. module.exports = class {}
              // e.g. module.exports = function {}
              // e.g. module.exports = () => {}
              return "id" in parentNode.right
                ? parentNode.right.id.name
                : "anonymousFunction";
            }
            return assigned.property.name;
          } else {
            // e.g. x.? = class {}
            // e.g. x.? = function {}
            // e.g. x.? = () => {}
            // Should not be possible
            throw new Error(
              unsupportedSyntax(path.node.type, this._getNodeId(path))
            );
          }
        } else {
          // e.g. {x} = class {}
          // e.g. {x} = function {}
          // e.g. {x} = () => {}
          // Should not be possible
          throw new Error(
            unsupportedSyntax(path.node.type, this._getNodeId(path))
          );
        }
      }
      case "ObjectProperty": {
        // e.g. {?: class {}}
        // e.g. {?: function {}}
        // e.g. {?: () => {}}
        if (parentNode.key.type === "Identifier") {
          // e.g. {y: class {}}
          // e.g. {y: function {}}
          // e.g. {y: () => {}}
          return parentNode.key.name;
        } else if (parentNode.key.type.includes("Literal")) {
          // e.g. {1: class {}}
          // e.g. {1: function {}}
          // e.g. {1: () => {}}
          return "value" in parentNode.key
            ? parentNode.key.value.toString()
            : "null";
        } else {
          // e.g. {?: class {}}
          // e.g. {?: function {}}
          // e.g. {?: () => {}}
          // Should not be possible
          throw new Error(
            unsupportedSyntax(path.node.type, this._getNodeId(path))
          );
        }
      }
      case "ReturnStatement":
      // e.g. return class {}
      // e.g. return function () {}
      // e.g. return () => {}
      case "ArrowFunctionExpression":
      // e.g. () => class {}
      // e.g. () => function () {}
      // e.g. () => () => {}
      case "NewExpression":
      // e.g. new Class(class {}) // dont think this one is possible but unsure
      // e.g. new Class(function () {})
      // e.g. new Class(() => {})
      case "CallExpression": {
        // e.g. function(class {}) // dont think this one is possible but unsure
        // e.g. function(function () {})
        // e.g. function(() => {})
        return "id" in path.node && path.node.id && "name" in path.node.id
          ? path.node.id.name
          : "anonymous";
      }
      case "ConditionalExpression": {
        // e.g. c ? class {} : b
        // e.g. c ? function () {} : b
        // e.g. c ? () => {} : b
        return this._getTargetNameOfExpression(path.parentPath);
      }
      case "LogicalExpression": {
        // e.g. c || class {}
        // e.g. c || function () {}
        // e.g. c || () => {}
        return this._getTargetNameOfExpression(path.parentPath);
      }
      default: {
        // e.g. class {}
        // e.g. function () {}
        // e.g. () => {}
        // Should not be possible
        throw new Error(
          `Unknown parent expression ${parentNode.type} for ${
            path.node.type
          } in ${this._getNodeId(path)}`
        );
      }
    }
  }

  public FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => void =
    (path) => {
      // e.g. function x() {}
      const targetName = this._getTargetNameOfDeclaration(path);
      const id = this._getNodeId(path);
      const export_ = this._getExport(id);

      this._extractFromFunction(
        path,
        id,
        id,
        targetName,
        export_,
        false,
        false
      );

      path.skip();
    };

  public ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => void = (
    path
  ) => {
    // e.g. class A {}
    const targetName = this._getTargetNameOfDeclaration(path);
    const id = this._getNodeId(path);
    const export_ = this._getExport(id);

    this._extractFromClass(path, id, id, targetName, export_);

    path.skip();
  };

  public FunctionExpression: (path: NodePath<t.FunctionExpression>) => void = (
    path
  ) => {
    // only thing left where these can be found is:
    // call(function () {})
    const targetName = this._getTargetNameOfExpression(path);
    const id = this._getNodeId(path);
    const export_ = this._getExport(id);

    this._extractFromFunction(path, id, id, targetName, export_, false, false);

    path.skip();
  };

  public ClassExpression: (path: NodePath<t.ClassExpression>) => void = (
    path
  ) => {
    // only thing left where these can be found is:
    // call(class {})
    const targetName = this._getTargetNameOfExpression(path);
    const id = this._getNodeId(path);
    const export_ = this._getExport(id);

    this._extractFromClass(path, id, id, targetName, export_);

    path.skip();
  };

  public ArrowFunctionExpression: (
    path: NodePath<t.ArrowFunctionExpression>
  ) => void = (path) => {
    // only thing left where these can be found is:
    // call(() => {})
    const targetName = this._getTargetNameOfExpression(path);

    if (path.parentPath.isVariableDeclarator()) {
      const id = this._getNodeId(path);
      const export_ = this._getExport(id);

      this._extractFromFunction(
        path,
        id,
        id,
        targetName,
        export_,
        false,
        false
      );
    } else {
      const id = this._getNodeId(path);
      const export_ = this._getExport(id);

      this._extractFromFunction(
        path,
        id,
        id,
        targetName,
        export_,
        false,
        false
      );
    }

    path.skip();
  };

  public VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => void = (
    path
  ) => {
    if (!path.has("init")) {
      path.skip();
      return;
    }
    const idPath = <NodePath<t.Identifier>>path.get("id");
    const init = path.get("init");

    const targetName = idPath.node.name;
    const id = this._getNodeId(path);
    const typeId = this._getNodeId(init);
    const export_ = this._getExport(id);

    if (init.isFunction()) {
      this._extractFromFunction(
        init,
        id,
        typeId,
        targetName,
        export_,
        false,
        false
      );
    } else if (init.isClass()) {
      this._extractFromClass(init, id, typeId, targetName, export_);
    } else if (init.isObjectExpression()) {
      this._extractFromObjectExpression(init, id, typeId, targetName, export_);
    } else {
      // TODO
    }

    path.skip();
  };

  public AssignmentExpression: (
    path: NodePath<t.AssignmentExpression>
  ) => void = (path) => {
    const left = path.get("left");
    const right = path.get("right");

    if (
      !right.isFunction() &&
      !right.isClass() &&
      !right.isObjectExpression()
    ) {
      return;
    }

    const targetName = this._getTargetNameOfExpression(right);
    let isObject = false;
    let isMethod = false;
    let objectId: string;

    let id: string = this._getBindingId(left);
    if (left.isMemberExpression()) {
      const object = left.get("object");
      const property = left.get("property");

      if (left.get("property").isIdentifier() && left.node.computed) {
        TargetVisitor.LOGGER.warn(
          "We do not support dynamic computed properties: x[a] = ?"
        );
        path.skip();
        return;
      } else if (!left.get("property").isIdentifier() && !left.node.computed) {
        // we also dont support a.f() = ?
        // or equivalent
        path.skip();
        return;
      }

      if (object.isIdentifier()) {
        // x.? = ?
        // x['?'] = ?
        if (object.node.name === "exports") {
          // exports.? = ?
          isObject = false;
          id = this._getBindingId(right);
        } else if (
          object.node.name === "module" &&
          property.isIdentifier() &&
          property.node.name === "exports"
        ) {
          // module.exports = ?
          isObject = false;
          id = this._getBindingId(right);
        } else {
          isObject = true;
          objectId = this._getBindingId(object);
          // find object
          const objectTarget = this._subTargets.find(
            (value) => value.id === objectId && value.type === TargetType.OBJECT
          );

          if (!objectTarget) {
            const export_ = this._getExport(objectId);
            // create one if it does not exist
            const objectTarget: ObjectTarget = {
              id: objectId,
              typeId: objectId,
              name: object.node.name,
              type: TargetType.OBJECT,
              exported: !!export_,
              default: export_ ? export_.default : false,
              module: export_ ? export_.module : false,
            };
            this._subTargets.push(objectTarget);
          }
        }
      } else if (object.isMemberExpression()) {
        // ?.?.? = ?
        const subObject = object.get("object");
        const subProperty = object.get("property");
        // what about module.exports.x
        if (
          subObject.isIdentifier() &&
          subProperty.isIdentifier() &&
          subProperty.node.name === "prototype"
        ) {
          // x.prototype.? = ?
          objectId = this._getBindingId(subObject);
          const objectTarget = <NamedSubTarget & Exportable>(
            this._subTargets.find((value) => value.id === objectId)
          );

          const newTargetClass: ClassTarget = {
            id: objectTarget.id,
            type: TargetType.CLASS,
            name: objectTarget.name,
            typeId: objectTarget.id,
            exported: objectTarget.exported,
            renamedTo: objectTarget.renamedTo,
            module: objectTarget.module,
            default: objectTarget.default,
          };

          // replace original target by prototype class
          this._subTargets[this._subTargets.indexOf(objectTarget)] =
            newTargetClass;

          const constructorTarget: MethodTarget = {
            id: objectTarget.id,
            type: TargetType.METHOD,
            name: objectTarget.name,
            typeId: objectTarget.id,
            methodType: "constructor",
            classId: objectTarget.id,
            visibility: "public",
            isStatic: false,
            isAsync:
              "isAsync" in objectTarget
                ? (<Callable>objectTarget).isAsync
                : false,
          };

          this._subTargets.push(constructorTarget);

          isMethod = true;
        }
      } else {
        path.skip();
        return;
      }
    }

    const typeId = this._getNodeId(right);
    const export_ = this._getExport(isObject ? objectId : id);

    if (right.isFunction()) {
      this._extractFromFunction(
        right,
        id,
        typeId,
        targetName,
        export_,
        isObject,
        isMethod,
        objectId
      );
    } else if (right.isClass()) {
      this._extractFromClass(right, id, typeId, targetName, export_);
    } else if (right.isObjectExpression()) {
      this._extractFromObjectExpression(right, id, typeId, targetName, export_);
    } else {
      // TODO
    }

    path.skip();
  };

  private _extractFromFunction(
    path: NodePath<t.Function>,
    functionId: string,
    typeId: string,
    functionName: string,
    export_: Export | undefined,
    isObjectFunction: boolean,
    isMethod: boolean,
    superId?: string
  ) {
    let target: FunctionTarget | ObjectFunctionTarget | MethodTarget;

    if (isObjectFunction && isMethod) {
      throw new Error("Cannot be method and object function");
    }

    if (isObjectFunction) {
      if (!superId) {
        throw new Error(
          "if it is an object function the object id should be given"
        );
      }
      target = {
        id: functionId,
        typeId: typeId,
        objectId: superId,
        name: functionName,
        type: TargetType.OBJECT_FUNCTION,
        isAsync: path.node.async,
      };
    } else if (isMethod) {
      if (!superId) {
        throw new Error(
          "if it is an object function the object id should be given"
        );
      }
      target = {
        id: functionId,
        typeId: typeId,
        classId: superId,
        name: functionName,
        type: TargetType.METHOD,
        isAsync: path.node.async,
        methodType: path.isClassMethod() ? path.node.kind : "method",
        visibility:
          path.isClassMethod() && path.node.access
            ? path.node.access
            : "public",
        isStatic:
          path.isClassMethod() || path.isClassProperty()
            ? path.node.static
            : false,
      };
    } else {
      target = {
        id: functionId,
        typeId: typeId,
        name: functionName,
        type: TargetType.FUNCTION,
        exported: !!export_,
        default: export_ ? export_.default : false,
        module: export_ ? export_.module : false,
        isAsync: path.node.async,
      };
    }

    this._subTargets.push(target);

    const body = path.get("body");

    if (Array.isArray(body)) {
      throw new TypeError("weird function body");
    } else {
      body.visit();
    }
  }

  private _extractFromObjectExpression(
    path: NodePath<t.ObjectExpression>,
    objectId: string,
    typeId: string,
    objectName: string,
    export_?: Export
  ) {
    const target: ObjectTarget = {
      id: objectId,
      typeId: typeId,
      name: objectName,
      type: TargetType.OBJECT,
      exported: !!export_,
      default: export_ ? export_.default : false,
      module: export_ ? export_.module : false,
    };

    this._subTargets.push(target);

    // loop over object properties
    for (const property of path.get("properties")) {
      if (property.isObjectMethod()) {
        if (property.node.key.type !== "Identifier") {
          // e.g. class A { ?() {} }
          // unsupported
          // not possible i think
          throw new Error("unknown class method key");
        }
        const targetName = property.node.key.name;

        const id = this._getNodeId(property);
        this._extractFromFunction(
          property,
          id,
          id,
          targetName,
          undefined,
          true,
          false,
          objectId
        );
      } else if (property.isObjectProperty()) {
        const key = property.get("key");
        const value = property.get("value");

        if (value) {
          const id = this._getNodeId(property);
          let targetName: string;
          if (key.isIdentifier()) {
            targetName = key.node.name;
          } else if (
            key.isStringLiteral() ||
            key.isBooleanLiteral() ||
            key.isNumericLiteral() ||
            key.isBigIntLiteral()
          ) {
            targetName = `${key.node.value}`;
          }

          if (value.isFunction()) {
            this._extractFromFunction(
              value,
              id,
              id,
              targetName,
              undefined,
              true,
              false,
              objectId
            );
          } else if (value.isClass()) {
            this._extractFromClass(value, id, id, targetName);
          } else if (value.isObjectExpression()) {
            this._extractFromObjectExpression(value, id, id, targetName);
          } else {
            // TODO
          }
        }
      } else if (property.isSpreadElement()) {
        // TODO
        // extract the spread element
      }
    }
  }

  private _extractFromClass(
    path: NodePath<t.Class>,
    classId: string,
    typeId: string,
    className: string,
    export_?: Export | undefined
  ): void {
    const target: ClassTarget = {
      id: classId,
      typeId: typeId,
      name: className,
      type: TargetType.CLASS,
      exported: !!export_,
      default: export_ ? export_.default : false,
      module: export_ ? export_.module : false,
    };

    this._subTargets.push(target);

    const body = <NodePath<t.ClassBody>>path.get("body");
    for (const classBodyAttribute of body.get("body")) {
      if (classBodyAttribute.isClassMethod()) {
        if (classBodyAttribute.node.key.type !== "Identifier") {
          // e.g. class A { ?() {} }
          // unsupported
          // not possible i think
          throw new Error("unknown class method key");
        }

        const targetName = classBodyAttribute.node.key.name;

        const id = this._getNodeId(classBodyAttribute);

        this._extractFromFunction(
          classBodyAttribute,
          id,
          id,
          targetName,
          undefined,
          false,
          true,
          classId
        );
      } else if (classBodyAttribute.isClassProperty()) {
        const key = classBodyAttribute.get("key");
        const value = classBodyAttribute.get("value");

        if (value) {
          const id = this._getNodeId(classBodyAttribute);
          let targetName: string;
          if (key.isIdentifier()) {
            targetName = key.node.name;
          } else if (
            key.isStringLiteral() ||
            key.isBooleanLiteral() ||
            key.isNumericLiteral() ||
            key.isBigIntLiteral()
          ) {
            targetName = `${key.node.value}`;
          }

          if (value.isFunction()) {
            this._extractFromFunction(
              value,
              id,
              id,
              targetName,
              undefined,
              false,
              true,
              classId
            );
          } else if (value.isClass()) {
            this._extractFromClass(value, id, id, targetName);
          } else if (value.isObjectExpression()) {
            this._extractFromObjectExpression(value, id, id, targetName);
          } else {
            // TODO
          }
        }
      } else {
        TargetVisitor.LOGGER.warn(
          `Unsupported class body attribute: ${classBodyAttribute.node.type}`
        );
      }
    }
  }

  get subTargets(): SubTarget[] {
    return this._subTargets
      .reverse()
      .filter((subTarget, index, self) => {
        if (!("name" in subTarget)) {
          // paths/branches/lines are always unique
          return true;
        }

        // filter duplicates because of redefinitions
        // e.g. let a = 1; a = 2;
        // this would result in two subtargets with the same name "a"
        // but we only want the last one
        return (
          index ===
          self.findIndex((t) => {
            return (
              "name" in t &&
              t.id === subTarget.id &&
              t.type === subTarget.type &&
              t.name === subTarget.name &&
              (t.type === TargetType.METHOD
                ? (<MethodTarget>t).methodType ===
                    (<MethodTarget>subTarget).methodType &&
                  (<MethodTarget>t).isStatic ===
                    (<MethodTarget>subTarget).isStatic &&
                  (<MethodTarget>t).classId ===
                    (<MethodTarget>subTarget).classId
                : true)
            );
          })
        );
      })
      .reverse();
  }
}
