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
import { AbstractSyntaxTreeVisitor } from "@syntest/ast-visitor-javascript";
import { ImplementationError } from "@syntest/diagnostics";

import { DiscoveredObjectKind, DiscoveredType } from "./DiscoveredType";

export class ObjectVisitor extends AbstractSyntaxTreeVisitor {
  private _objectTypeMap: Map<string, DiscoveredType>;

  // TODO separate stack for static and non-static properties
  private _objectStack: DiscoveredType[];

  get objectTypeMap(): Map<string, DiscoveredType> {
    return this._objectTypeMap;
  }

  constructor(filePath: string, syntaxForgiving: boolean) {
    super(filePath, syntaxForgiving);
    this._objectTypeMap = new Map();
    this._objectStack = [];
  }

  private _getCurrentObject(path: NodePath<t.Node>): DiscoveredType {
    if (this._objectStack.length === 0) {
      throw new ImplementationError(
        `No current object found! Location: ${this._getNodeId(path)}`
      );
    }
    return this._objectStack[this._objectStack.length - 1];
  }

  private _removeFromStack(path: NodePath<t.Node>): void {
    const currentObject = this._getCurrentObject(path);
    if (currentObject.id === this._getNodeId(path)) {
      this._objectStack.pop();
    } else {
      throw new ImplementationError(
        `Unexpected object stack state: ${
          currentObject.id
        } !== ${this._getNodeId(path)}`
      );
    }
  }

  private _getPropertyName(
    path: NodePath<t.ClassProperty["key"] | t.ObjectProperty["key"]>
  ): string | undefined {
    if ("computed" in path.parent && path.parent.computed) {
      // e.g. { [x.y]: 5 }
      return undefined;
    }

    if (path.isIdentifier()) {
      // e.g. class A { x = class {} }
      // e.g. class A { x = function () {} }
      // e.g. class A { x = () => {} }
      return path.node.name;
    } else if (path.isLiteral()) {
      // e.g. class A { "x" = class {} }
      // e.g. class A { "x" = function () {} }
      // e.g. class A { "x" = () => {} }
      return "value" in path.node ? path.node.value.toString() : "null";
    }
    // e.g. const {x} = class {}
    // e.g. const {x} = function {}
    // e.g. const {x} = () => {}
    // Should not be possible

    ObjectVisitor.LOGGER.warn(
      `Unexpected property name type: ${path.node.type} at ${this._getNodeId(
        path
      )}`
    );
    return undefined;
  }

  // classes
  public ClassExpression: (path: NodePath<t.ClassExpression>) => void = (
    path: NodePath<t.ClassExpression>
  ) => {
    const complexType: DiscoveredType = {
      id: this._getNodeId(path),
      kind: DiscoveredObjectKind.CLASS,
      properties: new Map(),
    };
    this._objectTypeMap.set(this._getNodeId(path), complexType);
    this._objectStack.push(complexType);

    path.get("body").visit();

    this._removeFromStack(path);

    path.skip();
  };

  public ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => void = (
    path: NodePath<t.ClassDeclaration>
  ) => {
    const complexType: DiscoveredType = {
      id: this._getNodeId(path),
      kind: DiscoveredObjectKind.CLASS,
      properties: new Map(),
    };
    this._objectTypeMap.set(this._getNodeId(path), complexType);
    this._objectStack.push(complexType);

    path.get("body").visit();

    this._removeFromStack(path);

    path.skip();
  };

  public ClassMethod: (path: NodePath<t.ClassMethod>) => void = (
    path: NodePath<t.ClassMethod>
  ) => {
    const name = this._getPropertyName(path.get("key"));
    const currentObject = this._getCurrentObject(path);

    currentObject.properties.set(name, this._getNodeId(path));
  };

  public ClassPrivateMethod: (path: NodePath<t.ClassPrivateMethod>) => void = (
    path: NodePath<t.ClassPrivateMethod>
  ) => {
    const name = this._getPropertyName(path.get("key").get("id"));
    const currentObject = this._getCurrentObject(path);

    currentObject.properties.set(`#${name}`, this._getNodeId(path));
  };

  public ClassProperty: (path: NodePath<t.ClassProperty>) => void = (
    path: NodePath<t.ClassProperty>
  ) => {
    const name = this._getPropertyName(path.get("key"));
    const currentObject = this._getCurrentObject(path);

    currentObject.properties.set(name, this._getNodeId(path));
  };

  public ClassPrivateProperty: (
    path: NodePath<t.ClassPrivateProperty>
  ) => void = (path: NodePath<t.ClassPrivateProperty>) => {
    const name = this._getPropertyName(path.get("key").get("id"));
    const currentObject = this._getCurrentObject(path);

    currentObject.properties.set(`#${name}`, this._getNodeId(path));
  };

  // TODO ClassAccessorProperty | TSDeclareMethod | TSIndexSignature | StaticBlock

  // TODO interfaces
  // public InterfaceDeclaration: (path: NodePath<t.InterfaceDeclaration>) => void = (
  //   path: NodePath<t.InterfaceDeclaration>
  // ) => {

  // };

  // Objects
  public ObjectExpression: (path: NodePath<t.ObjectExpression>) => void = (
    path: NodePath<t.ObjectExpression>
  ) => {
    const complexType: DiscoveredType = {
      id: this._getNodeId(path),
      kind: DiscoveredObjectKind.OBJECT,
      properties: new Map(),
    };
    this._objectTypeMap.set(this._getNodeId(path), complexType);
    this._objectStack.push(complexType);

    for (const property of path.get("properties")) {
      property.visit();
    }

    this._removeFromStack(path);

    path.skip();
  };

  public ObjectPattern: (path: NodePath<t.ObjectPattern>) => void = (
    path: NodePath<t.ObjectPattern>
  ) => {
    const complexType: DiscoveredType = {
      id: this._getNodeId(path),
      kind: DiscoveredObjectKind.OBJECT,
      properties: new Map(),
    };
    this._objectTypeMap.set(this._getNodeId(path), complexType);
    this._objectStack.push(complexType);

    for (const property of path.get("properties")) {
      property.visit();
    }

    this._removeFromStack(path);

    path.skip();
  };

  public ObjectMethod: (path: NodePath<t.ObjectMethod>) => void = (
    path: NodePath<t.ObjectMethod>
  ) => {
    const name = this._getPropertyName(path.get("key"));
    const currentObject = this._getCurrentObject(path);

    currentObject.properties.set(name, this._getNodeId(path));
  };

  public ObjectProperty: (path: NodePath<t.ObjectProperty>) => void = (
    path: NodePath<t.ObjectProperty>
  ) => {
    const currentObject = this._getCurrentObject(path);

    if (path.node.computed) {
      ObjectVisitor.LOGGER.warn(
        `This tool does not support computed property assignments. Found one at ${this._getNodeId(
          path
        )}`
      );
      return;
    }

    const key = path.get("key");
    if (key.isPrivateName()) {
      const name = this._getPropertyName(key.get("id"));

      currentObject.properties.set(`#${name}`, this._getNodeId(path));
    } else {
      const name = this._getPropertyName(key);

      currentObject.properties.set(name, this._getNodeId(path));
    }
  };

  // TODO SpreadElement

  // Functions
  public FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => void =
    (path: NodePath<t.FunctionDeclaration>) => {
      const complexType: DiscoveredType = {
        id: this._getNodeId(path),
        kind: DiscoveredObjectKind.FUNCTION,
        properties: new Map(),
      };
      this._objectTypeMap.set(this._getNodeId(path), complexType);
      this._objectStack.push(complexType);

      path.get("body").visit();

      this._removeFromStack(path);

      path.skip();
    };

  public FunctionExpression: (path: NodePath<t.FunctionExpression>) => void = (
    path: NodePath<t.FunctionExpression>
  ) => {
    const complexType: DiscoveredType = {
      id: this._getNodeId(path),
      kind: DiscoveredObjectKind.FUNCTION,
      properties: new Map(),
    };
    this._objectTypeMap.set(this._getNodeId(path), complexType);
    this._objectStack.push(complexType);

    path.get("body").visit();

    this._removeFromStack(path);

    path.skip();
  };

  public ArrowFunctionExpression: (
    path: NodePath<t.ArrowFunctionExpression>
  ) => void = (path: NodePath<t.ArrowFunctionExpression>) => {
    const complexType: DiscoveredType = {
      id: this._getNodeId(path),
      kind: DiscoveredObjectKind.FUNCTION,
      properties: new Map(),
    };
    this._objectTypeMap.set(this._getNodeId(path), complexType);
    this._objectStack.push(complexType);

    path.get("body").visit();

    this._removeFromStack(path);

    path.skip();
  };

  public MemberExpression: (path: NodePath<t.MemberExpression>) => void = (
    path: NodePath<t.MemberExpression>
  ) => {
    if (path.node.computed) {
      return;
    }

    if (path.node.object.type === "ThisExpression") {
      const parent = this._getThisParent(path);

      if (!parent) {
        return;
      }
      const _object = this.objectTypeMap.get(this._getNodeId(parent));

      if (!_object) {
        throw new ImplementationError(
          `Unexpected object type: ${
            path.node.object.type
          } at ${this._getNodeId(path)}`
        );
      }

      const property = path.get("property");
      if (property.isPrivateName()) {
        const name = this._getPropertyName(property.get("id"));

        _object.properties.set(`#${name}`, this._getNodeId(path));
      } else {
        const name = this._getPropertyName(property);

        _object.properties.set(name, this._getNodeId(path));
      }
    } else if (path.node.object.type === "Identifier") {
      const bindingId = this._getBindingId(path.get("object"));
      let _object = this.objectTypeMap.get(bindingId);

      if (!_object) {
        _object = {
          id: bindingId,
          kind: DiscoveredObjectKind.OBJECT, // not sure actually
          properties: new Map(),
        };
        this._objectTypeMap.set(bindingId, _object);
      }

      const property = path.get("property");

      if (property.isPrivateName()) {
        const name = this._getPropertyName(property.get("id"));

        _object.properties.set(`#${name}`, this._getNodeId(path));
      } else {
        const name = this._getPropertyName(property);

        _object.properties.set(name, this._getNodeId(path));
      }
    }
  };
}
