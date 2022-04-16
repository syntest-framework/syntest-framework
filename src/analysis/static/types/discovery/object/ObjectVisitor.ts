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
import { ScopeType } from "../Scope";

export class ObjectVisitor {

  private _filePath: string;
  private _objects: ComplexObject[]
  private _objectStack: ComplexObject[]

  get objects(): ComplexObject[] {
    return this._objects;
  }

  constructor(filePath: string) {
    this._filePath = filePath

    this._objects = []
    this._objectStack = []
  }

  private _enterObject(_object) {
    this._objectStack.push(_object)
  }

  private _exitObject(node) {
    if (node.id.name !== this._currentObject().name) {
      throw new Error("Exiting wrong object!")
    }
    this._objectStack.pop()
  }

  private _currentObject() {
    return this._objectStack[this._objectStack.length - 1]
  }

  // context
  public ClassDeclaration = {
    enter: (path) => {
      const _object: ComplexObject = {
        import: this._filePath,
        name: path.node.id.name,
        properties: new Set(),
        functions: new Set()
      }

      for (const classElement of path.node.body.body) {
        if (classElement.type === 'ClassProperty') {
          _object.properties.add(classElement.key.name)
        } else if (classElement.type === 'ClassMethod') {
          _object.functions.add(classElement.key.name)
        } else {
          throw new Error("unsupported class element: " + classElement.type)
        }
      }

      this._objects.push(_object)
      this._enterObject(_object)
    },
    exit: (path) => this._exitObject(path.node)
  }

  public FunctionDeclaration = {
    enter: (path) => {
      const _object: ComplexObject = {
        import: this._filePath,
        name: path.node.id.name,
        properties: new Set(),
        functions: new Set()
      }

      this._objects.push(_object)
      this._enterObject(_object)
    },
    exit: (path) => this._exitObject(path.node)
  }

  public MemberExpression: (path) => void = (path) => {
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


