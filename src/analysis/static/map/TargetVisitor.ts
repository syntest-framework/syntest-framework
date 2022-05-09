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
import { TargetMetaData } from "@syntest/framework";
import { ActionType } from "../parsing/ActionType";
import { ActionVisibility } from "../parsing/ActionVisibility";
import { ActionDescription } from "../parsing/ActionDescription";
import { TypeProbability } from "../types/resolving/TypeProbability";

// TODO only top level functions should be targettet
export class TargetVisitor {
  private _targetMap: Map<string, TargetMetaData>;
  private _functionMap: Map<string, Map<string, ActionDescription>>;

  constructor() {
    this._targetMap = new Map<string, TargetMetaData>();
    this._functionMap = new Map<string, Map<string, ActionDescription>>();
  }

  _createMaps(targetName) {
    if (!this._targetMap.has(targetName)) {
      this._targetMap.set(targetName, {
        name: targetName,
      });

      this._functionMap.set(targetName, new Map<string, ActionDescription>());
    }
  }




  // classic function declarations
  public FunctionExpression: (path) => void = (path) => {
    if (path.parent.type === 'CallExpression'
      || path.parent.type === 'NewExpression'
      || path.parent.type === 'ReturnStatement'
      || path.parent.type === 'LogicalExpression'
      || path.parent.type === 'ConditionalExpression'
      || path.parent.type === 'AssignmentExpression') {
      // anonymous argument function cannot call is not target
      return
    }

    let targetName;

    if (path.node.id) {
      targetName = path.node.id.name;
    } else if (path.parent.type === 'ObjectProperty') {
      // get identifier from assignment expression
      if (path.parent.key.type === 'Identifier') {
        targetName = path.parent.key.name
      } else {
        console.log(path.parent)
        throw new Error("unknown function expression name")
      }

    } else if (path.parent.type === 'VariableDeclarator') {
      // get identifier from assignment expression
      if (path.parent.id.type === 'Identifier') {
        targetName = path.parent.id.name
      } else {
        console.log(path.parent)
        throw new Error("unknown function expression name")
      }

    } else {
      console.log(path.parent)
      throw new Error("unknown function expression name")
    }

    const functionName = targetName;

    this._createMaps(targetName)

    this._functionMap.get(targetName).set(functionName, {
      name: functionName,
      type: ActionType.FUNCTION,
      visibility: ActionVisibility.PUBLIC,
      isConstructor: false,
      parameters: path.node.params.map(this._extractParam),
      returnParameter: {
        name: "returnValue",
        typeProbabilityMap: new TypeProbability(), // TODO unknown because javascript! (check how this looks in typescript)
      },
      isStatic: path.node.static,
      isAsync: path.node.async,
    });
  }

  public Program: (path) => void = (path) => {
    for (const key of Object.keys(path.scope.bindings)) {
      const binding = path.scope.bindings[key]

      const node = binding.path.node

      if (node.type === 'VariableDeclarator') {
        let init = node.init

        if (!init) {
          continue
        }

        // console.log(init.type)
        //
        // while (init.type === 'Identifier') {
        //   if (!path.scope.hasBinding(init.name)) {
        //     break
        //   }
        //   init = path.scope.bindings[init.name].path.node
        // }
        //
        if (init.type === "ArrowFunctionExpression") {
          const targetName = binding.identifier.name
          this._createMaps(targetName)
          this._createFunction(targetName, targetName, init)
        }

      } else if (node.type === 'ClassDeclaration') {
        const targetName = node.id.name;
        this._createMaps(targetName)
      } else if (node.type === 'FunctionDeclaration') {
        const targetName = node.id.name;
        this._createMaps(targetName)
        this._createFunction(targetName, targetName, node)
      }
    }
  }

  public ClassMethod: (path) => void = (path) => {
    const targetName = path.parentPath.parentPath.node.id.name;
    const functionName = path.node.key.name;

    let visibility = ActionVisibility.PUBLIC;
    if (path.node.access === "private") {
      visibility = ActionVisibility.PRIVATE;
    } else if (path.node.access === "protected") {
      visibility = ActionVisibility.PROTECTED;
    }

    this._functionMap.get(targetName).set(functionName, {
      name: functionName,
      type: functionName === "constructor" ? ActionType.CONSTRUCTOR : ActionType.METHOD,
      visibility: visibility,
      isConstructor: functionName === "constructor",
      parameters: path.node.params.map(this._extractParam),
      returnParameter: {
        name: "returnValue",
        typeProbabilityMap: new TypeProbability(), // TODO unknown because javascript! (check how this looks in typescript)
      },
      isStatic: path.node.static,
      isAsync: path.node.async,
    });
  };

  // prototyping
  public AssignmentExpression: (path) => void = (path) => {
    if (path.node.right.type !== "FunctionExpression") {
      return
    }

    let targetName

    if (path.node.left.type === "MemberExpression") {
      if (path.node.left.object.type === 'MemberExpression'
        && path.node.left.object.property.name === 'prototype') {
        targetName = path.node.left.object.object.name
        const functionName = path.node.left.property.name

        if (path.node.left.computed) {
          // we cannot know the name of computed properties unless we find out what the identifier refers to
          // see line 136 of Axios.js as example
          // Axios.prototype[method] = ?
          return
        }

        if (functionName === "method") {
          console.log(path.node)
          process.exit()
        }

        if (!this._functionMap.has(targetName)) {
          throw new Error("target not discovered yet")
        }

        // modify original
        this._functionMap.get(targetName).get(targetName).type = ActionType.CONSTRUCTOR
        this._functionMap.get(targetName).get(targetName).isConstructor = true

        this._functionMap.get(targetName).set(functionName, {
          name: functionName,
          type: functionName === "constructor" ? ActionType.CONSTRUCTOR : ActionType.METHOD,
          visibility: ActionVisibility.PUBLIC,
          isConstructor: functionName === "constructor",
          parameters: path.node.right.params.map(this._extractParam),
          returnParameter: {
            name: "returnValue",
            typeProbabilityMap: new TypeProbability(), // TODO unknown because javascript! (check how this looks in typescript)
          },
          isStatic: path.node.right.static,
          isAsync: path.node.right.async,
        });
        return
      } else {
        targetName = path.node.left.property.name

      }

    } else if (path.node.left.type === 'Identifier') {
        targetName = path.node.left.name
    } else {
      console.log(path.node)
      throw new Error("unknown function expression name")
    }

    if (!this.targetMap.has(targetName)) {
      this._createMaps(targetName)
    }

    this._functionMap.get(targetName).set(targetName, {
      name: targetName,
      type: ActionType.FUNCTION,
      visibility: ActionVisibility.PUBLIC,
      isConstructor: false,
      parameters: path.node.right.params.map(this._extractParam),
      returnParameter: {
        name: "returnValue",
        typeProbabilityMap: new TypeProbability(), // TODO unknown because javascript! (check how this looks in typescript)
      },
      isStatic: path.node.right.static,
      isAsync: path.node.right.async,
    });
  }

    // functions
  public _createFunction (targetName, functionName, node) {
    this._functionMap.get(targetName).set(functionName, {
      name: functionName,
      type: ActionType.FUNCTION,
      visibility: ActionVisibility.PUBLIC,
      isConstructor: false,
      parameters: node.params.map(this._extractParam),
      returnParameter: {
        name: "returnValue",
        typeProbabilityMap: new TypeProbability(),
      },
      isStatic: node.static,
      isAsync: node.async,
    });
  }

  _extractParam(param: any) {
      if (param.type === 'RestElement') {
        // TODO this can actually be an infinite amount of arguments...
        param = param.argument
      }

      if (param.type === "AssignmentPattern") {
        param = param.left
      }

    if (param.type === "ObjectPattern") {
      param = {
        name: `{${param.properties.map((x)=> x.key.name).join(',')}}`
      }
    }

      if (!param.name) {
        console.log(param)
        throw new Error("Unknown param")
      }

      return {
        name: param.name,
        type: "unknown", // TODO unknown because javascript! (check how this looks in typescript)
      };

  }

  get targetMap(): Map<string, any> {
    return this._targetMap;
  }

  get functionMap(): Map<string, Map<string, any>> {
    return this._functionMap;
  }
}
