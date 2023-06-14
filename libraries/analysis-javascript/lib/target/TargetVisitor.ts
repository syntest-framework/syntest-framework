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
  ClassTarget,
  FunctionTarget,
  MethodTarget,
  ObjectFunctionTarget,
  ObjectTarget,
  SubTarget,
} from "./Target";
import { VisibilityType } from "./VisibilityType";
import { Export } from "./export/Export";
import { unsupportedSyntax } from "../utils/diagnostics";
import { getLogger, Logger } from "@syntest/logging";

const COMPUTED_FLAG = ":computed:";
export class TargetVisitor extends AbstractSyntaxTreeVisitor {
  protected static override LOGGER: Logger;

  private _exports: Export[];

  private _subTargets: SubTarget[];

  constructor(filePath: string, exports: Export[]) {
    super(filePath);
    TargetVisitor.LOGGER = getLogger("TargetVisitor");
    this._exports = exports;
    this._subTargets = [];
  }

  private _getExport(
    path: NodePath<t.Node>,
    targetName: string
  ): Export | undefined {
    // TODO scoping
    // what if renamed
    return this._exports.find((x) => {
      return x.name === targetName || x.renamedTo === targetName;
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
      case "ReturnStatement": {
        // e.g. return class {}
        // e.g. return function () {}
        // e.g. return () => {}
        return "id" in path.node && path.node.id && "name" in path.node.id
          ? path.node.id.name
          : "anonymous";
      }
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
        // return "id" in path.node && path.node.id
        //     ? path.node.id.name
        //     : "anonymous";
      }
      case "LogicalExpression": {
        // e.g. c || class {}
        // e.g. c || function () {}
        // e.g. c || () => {}
        return this._getTargetNameOfExpression(path.parentPath);
        // return "id" in path.node && path.node.id
        //     ? path.node.id.name
        //     : "anonymous";
      }
      default: {
        // e.g. class {}
        // e.g. function () {}
        // e.g. () => {}
        // Should not be possible
        throw new Error(
          `unknown class expression ${parentNode.type} in ${this.filePath}`
        );
      }
    }
  }

  public FunctionExpression: (path: NodePath<t.FunctionExpression>) => void = (
    path
  ) => {
    this._functionExpression(path);
  };

  public FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => void =
    (path) => {
      // e.g. function x() {}
      const targetName = this._getTargetNameOfDeclaration(path);
      const export_ = this._getExport(path, targetName);

      const target: FunctionTarget = {
        id: `${this._getNodeId(path)}`,
        name: targetName,
        type: TargetType.FUNCTION,
        exported: !!export_,
        default: export_ ? export_.default : false,
        module: export_ ? export_.module : false,
        isAsync: path.node.async,
      };

      this.subTargets.push(target);
    };

  public ClassExpression: (path: NodePath<t.ClassExpression>) => void = (
    path
  ) => {
    const targetName = this._getTargetNameOfExpression(path);
    const export_ = this._getExport(path, targetName);

    const target: ClassTarget = {
      id: `${this._getNodeId(path)}`,
      name: targetName,
      type: TargetType.CLASS,
      exported: !!export_,
      default: export_ ? export_.default : false,
      module: export_ ? export_.module : false,
    };

    this.subTargets.push(target);
  };

  public ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => void = (
    path
  ) => {
    // e.g. class A {}
    const targetName = this._getTargetNameOfDeclaration(path);
    const export_ = this._getExport(path, targetName);

    const target: ClassTarget = {
      id: `${this._getNodeId(path)}`,
      name: targetName,
      type: TargetType.CLASS,
      exported: !!export_,
      default: export_ ? export_.default : false,
      module: export_ ? export_.module : false,
    };

    this.subTargets.push(target);
  };

  private _getParentClassName(
    path: NodePath<
      | t.ClassMethod
      | t.ClassProperty
      | t.ClassPrivateMethod
      | t.ClassPrivateProperty
    >
  ): string {
    const parentNode = path.parentPath.parentPath.node;
    const parentOfParentNode = path.parentPath.parentPath.parentPath.node;
    if (parentNode.type === "ClassDeclaration") {
      // e.g. class A { ... }
      if (parentNode.id && parentNode.id.type === "Identifier") {
        return parentNode.id.name;
      } else if (
        parentOfParentNode !== undefined &&
        parentOfParentNode.type === "ExportDefaultDeclaration"
      ) {
        // e.g. export default class { ... }
        return "default";
      } else {
        // e.g. class { ... }
        // unsupported
        // should not be possible
        throw new Error("unknown class method parent");
      }
    } else if (parentNode.type === "ClassExpression") {
      // e.g. const x = class A { ... }
      // e.g. const x = class { ... }
      // e.g. { x: class A { ... } }
      // in all cases the name should be x

      if (
        parentOfParentNode !== undefined &&
        parentOfParentNode.type === "VariableDeclarator"
      ) {
        // e.g. ? = class A { ... }
        if (parentOfParentNode.id.type === "Identifier") {
          // e.g. const x = class A { ... }
          return parentOfParentNode.id.name;
        } else {
          // e.g. ? = class { ... }
          // unsupported
          // should not be possible
          throw new Error("unknown class method parent");
        }
      } else if (
        parentOfParentNode !== undefined &&
        parentOfParentNode.type === "ObjectProperty"
      ) {
        // e.g. { x: class A { ... } }
        if (parentOfParentNode.key.type === "Identifier") {
          return parentOfParentNode.key.name;
        } else if (parentOfParentNode.key.type.includes("Literal")) {
          // e.g. { "x": class A { ... } }
          return "value" in parentOfParentNode.key
            ? parentOfParentNode.key.value.toString()
            : "null";
        } else {
          // e.g. { ??: class { ... } }
          // unsupported
          throw new Error("unknown class method parent");
        }
      } else {
        // unsupported
        throw new Error("unknown class method parent");
      }
    } else {
      // unsupported
      throw new Error("unknown class method parent");
    }
  }

  public ClassMethod: (path: NodePath<t.ClassMethod>) => void = (path) => {
    if (path.parentPath.type !== "ClassBody") {
      // unsupported
      // not possible i think
      throw new Error("unknown class method parent");
    }

    const parentClassName: string = this._getParentClassName(path);

    if (path.node.key.type !== "Identifier") {
      // e.g. class A { ?() {} }
      // unsupported
      // not possible i think
      throw new Error("unknown class method key");
    }

    const targetName = path.node.key.name;

    let visibility = VisibilityType.PUBLIC;
    if (path.node.access === "private") {
      visibility = VisibilityType.PRIVATE;
    } else if (path.node.access === "protected") {
      visibility = VisibilityType.PROTECTED;
    }

    const target: MethodTarget = {
      id: `${this._getNodeId(path)}`,
      name: targetName,
      type: TargetType.METHOD,
      className: parentClassName,
      isStatic: path.node.static,
      isAsync: path.node.async,
      methodType: path.node.kind,
      visibility: visibility,
    };

    this.subTargets.push(target);
  };

  private _functionExpression(
    path: NodePath<t.ArrowFunctionExpression | t.FunctionExpression>
  ) {
    // e.g. const x = () => {}
    const targetName = this._getTargetNameOfExpression(path);

    const parent = path.parentPath;
    let left;
    if (
      parent.isAssignmentExpression() &&
      ((left = parent.get("left")), left.isMemberExpression())
    ) {
      let object = left.get("object");
      const property = left.get("property");

      if (object.isMemberExpression()) {
        const subObject = object.get("object");
        const subProperty = object.get("property");

        if (!subProperty.isIdentifier()) {
          // e.g. a.x().y = function () {}
          // unsupported
          throw new Error(
            unsupportedSyntax(path.node.type, this._getNodeId(path))
          );
        }

        if (subProperty.node.name === "prototype") {
          // e.g. a.prototype.y = function() {}
          object = subObject;
          if (object.isIdentifier()) {
            const prototypeName = object.node.name;
            // find function
            const target = <FunctionTarget>(
              this._subTargets.find(
                (target) =>
                  target.type === TargetType.FUNCTION &&
                  (<FunctionTarget>target).name === prototypeName
              )
            );
            if (target) {
              // remove
              this._subTargets = this._subTargets.filter(
                (subTarget) => subTarget.id !== target.id
              );
              // add new
              this._subTargets.push(
                <ClassTarget>{
                  id: target.id,
                  type: TargetType.CLASS,
                  name: target.name,
                  exported: target.exported,
                  renamedTo: target.renamedTo,
                  module: target.module,
                  default: target.default,
                },
                // add constructor
                <MethodTarget>{
                  id: target.id,
                  type: TargetType.METHOD,
                  name: "constructor",
                  className: prototypeName,

                  visibility: VisibilityType.PUBLIC,

                  methodType: "constructor",
                  isStatic: false,
                  isAsync: target.isAsync,
                }
              );
            }
            // add this as class method
            if (!property.isIdentifier()) {
              throw new Error(
                unsupportedSyntax(path.node.type, this._getNodeId(path))
              );
            }

            this._subTargets.push(<MethodTarget>{
              id: `${this._getNodeId(path)}`,
              type: TargetType.METHOD,
              name: property.node.name,
              className: prototypeName,

              visibility: VisibilityType.PUBLIC,

              methodType: "method",
              isStatic: false,
              isAsync: path.node.async,
            });
            return;
          } else {
            // e.g. a().prototype.y = function() {}
            throw new Error(
              unsupportedSyntax(path.node.type, this._getNodeId(path))
            );
          }
        } else {
          // e.g. a.x.y = function () {}
          // unsupported for now should create a objecttarget as a subtarget
          throw new Error(
            unsupportedSyntax(path.node.type, this._getNodeId(path))
          );
        }
      }

      // e.g. a.x = function () {}
      if (object.isIdentifier()) {
        if (
          left.node.computed == true &&
          !property.node.type.includes("Literal")
        ) {
          // e.g. x[y] = class {}
          // e.g. x[y] = function {}
          // e.g. x[y] = () => {}
          // TODO unsupported cannot get the name unless executing
          TargetVisitor.LOGGER.warn(
            `This tool does not support computed property assignments. Found one at ${this._getNodeId(
              path
            )}`
          );
          return;
        }

        const functionName = property.isIdentifier()
          ? property.node.name
          : "value" in property.node
          ? property.node.value.toString()
          : "null";

        if (object.node.name === "exports") {
          // e.g. exports.x =  function () {}
          // this is simply a function not an object function
          const export_ = this._getExport(path, functionName);

          const functionTarget: FunctionTarget = {
            id: `${this._getNodeId(path)}`,
            type: TargetType.FUNCTION,
            name: functionName,
            exported: !!export_,
            default: export_ ? export_.default : false,
            module: export_ ? export_.module : false,
            isAsync: path.node.async,
          };
          this._subTargets.push(functionTarget);
        } else {
          const export_ = this._getExport(path, object.node.name);

          const objectTarget: ObjectTarget = {
            type: TargetType.OBJECT,
            name: object.node.name,
            id: `${this._getBindingId(object)}`,
            exported: !!export_,
            default: export_ ? export_.default : false,
            module: export_ ? export_.module : false,
          };
          const objectFunctionTarget: ObjectFunctionTarget = {
            type: TargetType.OBJECT_FUNCTION,
            objectName: object.node.name,
            name: functionName,
            id: `${this._getNodeId(path)}`,
            isAsync: path.node.async,
          };

          this.subTargets.push(objectTarget, objectFunctionTarget);
        }
      } else if (object.isThisExpression()) {
        // TODO repair this
        // get the this scope object name
        // create new object function target
        return;
      } else {
        // e.g. a().x = function () {}
        // unsupported
        throw new Error(
          unsupportedSyntax(path.node.type, this._getNodeId(path))
        );
      }
    } else
      switch (parent.node.type) {
        case "ClassPrivateProperty": {
          // e.g. class A { #x = () => {} }
          // unsupported
          throw new Error("unknown class method parent");
        }
        case "ClassProperty": {
          // e.g. class A { x = () => {} }
          const parentClassName: string = this._getParentClassName(
            <NodePath<t.ClassProperty>>path.parentPath
          );

          const visibility = VisibilityType.PUBLIC;
          // apparantly there is no access property on class properties
          // if (parentNode.access === "private") {
          //   visibility = VisibilityType.PRIVATE;
          // } else if (parentNode.access === "protected") {
          //   visibility = VisibilityType.PROTECTED;
          // }

          const target: MethodTarget = {
            id: `${this._getNodeId(path)}`,
            className: parentClassName,
            name: targetName,
            type: TargetType.METHOD,
            isStatic: (<t.ClassProperty>parent.node).static,
            isAsync: path.node.async,
            methodType: "method",
            visibility: visibility,
          };

          this.subTargets.push(target);

          break;
        }
        case "VariableDeclarator": {
          if (!path.parentPath.has("id")) {
            // unsupported
            throw new Error(
              unsupportedSyntax(path.node.type, this._getNodeId(path))
            );
          }

          const export_ = this._getExport(path, targetName);

          const target: FunctionTarget = {
            id: `${this._getNodeId(path.parentPath)}`,
            name: targetName,
            type: TargetType.FUNCTION,
            exported: !!export_,
            default: export_ ? export_.default : false,
            module: export_ ? export_.module : false,
            isAsync: path.node.async,
          };

          this.subTargets.push(target);

          break;
        }
        case "LogicalExpression":
        case "ConditionalExpression": {
          const export_ = this._getExport(path, targetName);

          let parent = path.parentPath;

          while (parent.isLogicalExpression() || parent.isConditional()) {
            parent = parent.parentPath;
          }

          const target: FunctionTarget = {
            id: `${this._getNodeId(parent)}`,
            name: targetName,
            type: TargetType.FUNCTION,
            exported: !!export_,
            default: export_ ? export_.default : false,
            module: export_ ? export_.module : false,
            isAsync: path.node.async,
          };

          this.subTargets.push(target);
        }
        default: {
          const export_ = this._getExport(path, targetName);

          const target: FunctionTarget = {
            id: `${this._getNodeId(path)}`,
            name: targetName,
            type: TargetType.FUNCTION,
            exported: !!export_,
            default: export_ ? export_.default : false,
            module: export_ ? export_.module : false,
            isAsync: path.node.async,
          };

          this.subTargets.push(target);
        }
      }
  }

  public ArrowFunctionExpression: (
    path: NodePath<t.ArrowFunctionExpression>
  ) => void = (path) => {
    this._functionExpression(path);
  };

  // public VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => void = (
  //   path
  // ) => {
  //   if (!path.node.init) {
  //     return;
  //   }

  //   if (!(path.node.init.type === "ArrowFunctionExpression")) {
  //     return;
  //   }

  //   const targetName = path.node.id.name;
  //   const functionName = targetName;

  //   this._createMaps(targetName);

  //   let scope;
  //   path.traverse({
  //     ArrowFunctionExpression: {
  //       enter: (p) => {
  //         scope = {
  //           uid: `${p.scope.uid - this.scopeIdOffset}`,
  //           filePath: this.filePath,
  //         };
  //       },
  //     },
  //     FunctionExpression: {
  //       enter: (p) => {
  //         scope = {
  //           uid: `${p.scope.uid - this.scopeIdOffset}`,
  //           filePath: this.filePath,
  //         };
  //       },
  //     },
  //   });

  //   this._functionMap.get(targetName).set(functionName, {
  //     scope: scope,
  //     name: functionName,
  //     type: ActionType.FUNCTION,
  //     visibility: VisibilityType.PUBLIC,
  //     isConstructor: false,
  //     parameters: path.node.init.params.map((x) => this._extractParam(x)),
  //     returnParameter: {
  //       name: "returnValue",
  //       typeProbabilityMap: new TypeProbability(), // TODO unknown because javascript! (check how this looks in typescript)
  //     },
  //     isStatic: path.node.init.static,
  //     isAsync: path.node.init.async,
  //   });
  // };

  // // prototyping
  // public AssignmentExpression: (
  //   path: NodePath<t.AssignmentExpression>
  // ) => void = (path) => {
  //   if (path.node.right.type !== "FunctionExpression") {
  //     return;
  //   }

  //   let scope;
  //   path.traverse({
  //     FunctionExpression: {
  //       enter: (p) => {
  //         scope = {
  //           uid: `${p.scope.uid - this.scopeIdOffset}`,
  //           filePath: this.filePath,
  //         };
  //       },
  //     },
  //   });

  //   let targetName;

  //   if (path.node.left.type === "MemberExpression") {
  //     if (
  //       path.node.left.object.name === "module" &&
  //       path.node.left.property.name === "exports"
  //     ) {
  //       targetName = path.node.right.id?.name;

  //       if (!targetName) {
  //         targetName = "anon";
  //       }
  //     } else if (path.node.left.object.name === "exports") {
  //       targetName = path.node.left.property.name;
  //     } else if (
  //       path.node.left.object.type === "MemberExpression" &&
  //       path.node.left.object.property.name === "prototype"
  //     ) {
  //       targetName = path.node.left.object.object.name;
  //       const functionName = path.node.left.property.name;

  //       if (path.node.left.computed) {
  //         // we cannot know the name of computed properties unless we find out what the identifier refers to
  //         // see line 136 of Axios.js as example
  //         // Axios.prototype[method] = ?
  //         return;
  //       }

  //       if (functionName === "method") {
  //         throw new Error("Invalid functionName");
  //       }

  //       if (this._functionMap.has(targetName)) {
  //         // modify original
  //         this._functionMap.get(targetName).get(targetName).type =
  //           ActionType.CONSTRUCTOR;
  //         this._functionMap.get(targetName).get(targetName).isConstructor =
  //           true;
  //       } else {
  //         this._createMaps(targetName);

  //         // modify original
  //         // but there is no original so... no constructor?
  //       }

  //       // TODO this one is probably wrong

  //       this._functionMap.get(targetName).set(functionName, {
  //         scope: scope,
  //         name: functionName,
  //         type:
  //           functionName === "constructor"
  //             ? ActionType.CONSTRUCTOR
  //             : ActionType.METHOD,
  //         visibility: VisibilityType.PUBLIC,
  //         isConstructor: functionName === "constructor",
  //         parameters: path.node.right.params.map((x) => this._extractParam(x)),
  //         returnParameter: {
  //           name: "returnValue",
  //           typeProbabilityMap: new TypeProbability(), // TODO unknown because javascript! (check how this looks in typescript)
  //         },
  //         isStatic: path.node.right.static,
  //         isAsync: path.node.right.async,
  //       });
  //       return;
  //     } else {
  //       targetName = path.node.left.object.name;
  //       const functionName = path.node.left.property.name;

  //       if (path.node.left.computed) {
  //         // we cannot know the name of computed properties unless we find out what the identifier refers to
  //         // see line 136 of Axios.js as example
  //         // Axios.prototype[method] = ?
  //         return;
  //       }

  //       if (functionName === "method") {
  //         throw new Error("Invalid functionName");
  //       }

  //       if (!this._functionMap.has(targetName)) {
  //         this._createMaps(targetName);

  //         // modify original
  //         // but there is no original so... no constructor?
  //       }

  //       if (this.functionMap.get(targetName).has(targetName)) {
  //         // modify original
  //         this._functionMap.get(targetName).get(targetName).type =
  //           ActionType.CONSTRUCTOR;
  //         this._functionMap.get(targetName).get(targetName).isConstructor =
  //           true;
  //       }

  //       // TODO this one is probably wrong

  //       this._functionMap.get(targetName).set(functionName, {
  //         scope: scope,
  //         name: functionName,
  //         type: ActionType.METHOD,
  //         visibility: VisibilityType.PUBLIC,
  //         isConstructor: false,
  //         parameters: path.node.right.params.map((x) => this._extractParam(x)),
  //         returnParameter: {
  //           name: "returnValue",
  //           typeProbabilityMap: new TypeProbability(), // TODO unknown because javascript! (check how this looks in typescript)
  //         },
  //         isStatic: path.node.right.static,
  //         isAsync: path.node.right.async,
  //       });
  //       return;
  //     }
  //   } else if (path.node.left.type === "Identifier") {
  //     targetName = path.node.left.name;
  //   } else {
  //     throw new Error("unknown function expression name");
  //   }

  //   if (!this.targetMap.has(targetName)) {
  //     this._createMaps(targetName);
  //   }

  //   this._functionMap.get(targetName).set(targetName, {
  //     scope: scope,
  //     name: targetName,
  //     type: ActionType.FUNCTION,
  //     visibility: VisibilityType.PUBLIC,
  //     isConstructor: false,
  //     parameters: path.node.right.params.map((x) => this._extractParam(x)),
  //     returnParameter: {
  //       name: "returnValue",
  //       typeProbabilityMap: new TypeProbability(), // TODO unknown because javascript! (check how this looks in typescript)
  //     },
  //     isStatic: path.node.right.static,
  //     isAsync: path.node.right.async,
  //   });
  // };

  get subTargets(): SubTarget[] {
    // filter duplicates because of redefinitions
    // e.g. let a = 1; a = 2;
    // this would result in two subtargets with the same name "a"
    // but we only want the last one
    this._subTargets = this._subTargets
      .reverse()
      .filter((subTarget, index, self) => {
        if ("name" in subTarget) {
          return (
            index ===
            self.findIndex((t) => {
              return (
                "name" in t &&
                t.type === subTarget.type &&
                t.name === subTarget.name &&
                (t.type === TargetType.METHOD
                  ? (<MethodTarget>t).methodType ===
                      (<MethodTarget>subTarget).methodType &&
                    (<MethodTarget>t).isStatic ===
                      (<MethodTarget>subTarget).isStatic &&
                    (<MethodTarget>t).className ===
                      (<MethodTarget>subTarget).className
                  : true)
              );
            })
          );
        }

        // paths/branches/lines are always unique
        return true;
      })
      .reverse();

    return this._subTargets;
  }
}
