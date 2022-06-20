/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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
import { ComplexObject } from "./ComplexObject";
import { Visitor } from "../../../Visitor";
import { Export } from "../../../dependency/ExportVisitor";

export class ObjectVisitor extends Visitor {

  private _exports: Export[]
  private _objects: ComplexObject[]
  private _objectStack: ComplexObject[]

  get objects(): ComplexObject[] {
    return this._objects;
  }

  constructor(filePath: string, exports: Export[]) {
    super(filePath)
    this._exports = exports
    this._objects = []
    this._objectStack = []

    const object: ComplexObject = {
      name: "global",
      properties: new Set<string>(),
      functions: new Set<string>()
    }

    this._objects.push(object)
    this._objectStack.push(object)
  }

  private _enterObject(_object: ComplexObject) {
    this._objectStack.push(_object)
  }

  private _exitObject(node) {
    if ((node.id ? node.id.name : 'anon') !== this._currentObject().name) {
      throw new Error("Exiting wrong object!")
    }
    this._objectStack.pop()
  }

  private _currentObject() {
    if (!this._objectStack.length) {
      throw new Error("No current object available! " + this.filePath)
    }

    return this._objectStack[this._objectStack.length - 1]
  }

  // context
  public ClassDeclaration = {
    enter: (path) => {
      const name = path.node.id.name
      const _export = this._exports.find((e) => e.name === name)

      const _object: ComplexObject = {
        export: _export,
        name: name,
        properties: new Set(),
        functions: new Set()
      }

      for (const classElement of path.node.body.body) {
        if (classElement.type === 'ClassProperty'
          || classElement.type === 'ClassPrivateProperty') {
          _object.properties.add(classElement.key.name)
        } else if (classElement.type === 'ClassMethod') {
          _object.functions.add(classElement.key.name)
        } else {
          throw new Error(`unsupported class element: ${classElement.type}\n${this.filePath}`)
        }
      }

      this._objects.push(_object)
      this._enterObject(_object)
    },
    exit: (path) => this._exitObject(path.node)
  }

  public FunctionDeclaration = {
    enter: (path) => {
      const name = path.node.id?.name || 'anon'
      const _export = this._exports.find((e) => e.name === name)

      const _object: ComplexObject = {
        export: _export,
        name: name,
        properties: new Set(),
        functions: new Set()
      }

      this._objects.push(_object)
      this._enterObject(_object)
    },
    exit: (path) => this._exitObject(path.node)
  }

  public FunctionExpression = {
    enter: (path) => {
      const name = path.node.id?.name || 'anon'
      const _export = this._exports.find((e) => e.name === name)
      // TODO find the object where we are assigning to if its an assignment
      const _object: ComplexObject = {
        export: _export,
        name: name,
        properties: new Set(),
        functions: new Set()
      }

      this._objects.push(_object)
      this._enterObject(_object)
    },
    exit: (path) => this._exitObject(path.node)
  }

  public ObjectExpression = {
    enter: (path) => {
      const name = path.node.id?.name || 'anon'
      const _export = this._exports.find((e) => e.name === name)
      // TODO find the object where we are assigning to if its an assignment
      const _object: ComplexObject = {
        export: _export,
        name: name,
        properties: new Set(),
        functions: new Set()
      }

      for (const prop of path.node.properties) {
        if (prop.type === 'ObjectMethod') {
          _object.functions.add(prop.key.name)
        } else if (prop.type === 'ObjectProperty') {
          _object.properties.add(prop.key.name)
        } else {
          // TODO spread element
        }
      }

      this._objects.push(_object)
      this._enterObject(_object)
    },
    exit: (path) => this._exitObject(path.node)
  }

  public MemberExpression: (path) => void = (path) => {
    if (path.node.computed) {
      return
    }

    // TODO support for prototyping  (./axios/lib/cancel/Cancel.js)
    if (path.node.object.type === "ThisExpression") {
      const _object = this._currentObject()

      if (path.parent.type === 'CallExpression') {
        _object.functions.add(path.node.property.name)
      } else {
        _object.properties.add(path.node.property.name)
      }
    }
  }

  // TODO add interface stuff

}


