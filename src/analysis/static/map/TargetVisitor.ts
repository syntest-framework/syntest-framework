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

// TODO check if exported (and how)
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

  public ClassDeclaration: (path) => void = (path) => {
    const targetName = path.node.id.name;
    this._createMaps(targetName)
  };

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

  // classic function declarations
  public FunctionDeclaration: (path) => void = (path) => {
    const targetName = path.node.id.name;
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

  // arrow function
  public ArrowFunctionExpression: (path) => void = (path) => {
    const targetName = path.node.id
      ? path.node.id.name
      : (path.parent.id
        ? path.parent.id.name
        : 'anonymous');
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

  _extractParam(param: any) {
      if (param.type === 'RestElement') {
        // TODO this can actually be an infinite amount of arguments...
      }

      if (param.type === "AssignmentPattern") {
        param = param.left
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
