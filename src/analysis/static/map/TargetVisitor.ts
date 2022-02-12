import { PrivateVisibility, PublicVisibility, TargetMetaData } from "@syntest/framework";
import { JavaScriptFunction, ProtectedVisibility } from "./JavaScriptFunction";
import { TypeResolver } from "../types/TypeResolver";
import { ScopeType } from "../variable/Scope";

// TODO check if exported (and how)
export class TargetVisitor {
  private _targetMap: Map<string, TargetMetaData>;
  private _functionMap: Map<string, Map<string, JavaScriptFunction>>;


  constructor() {
    this._targetMap = new Map<string, TargetMetaData>();
    this._functionMap = new Map<string, Map<string, JavaScriptFunction>>();
  }

  _createMaps(targetName) {
    if (!this._targetMap.has(targetName)) {
      this._targetMap.set(targetName, {
        name: targetName,
      });

      this._functionMap.set(targetName, new Map<string, JavaScriptFunction>());
    }
  }

  public ClassDeclaration: (path) => void = (path) => {
    const targetName = path.node.id.name;
    this._createMaps(targetName)
  };

  public ClassMethod: (path) => void = (path) => {
    const targetName = path.parentPath.parentPath.node.id.name;
    const functionName = path.node.key.name;

    let visibility = PublicVisibility;
    if (path.node.access === "private") {
      visibility = PrivateVisibility;
    } else if (path.node.access === "protected") {
      visibility = ProtectedVisibility;
    }

    this._functionMap.get(targetName).set(functionName, {
      name: functionName,
      type: functionName === "constructor" ? "constructor" : "method",
      visibility: visibility,
      isConstructor: functionName === "constructor",
      parameters: path.node.params.map(this._extractParam),
      returnParameters: [
        {
          name: "unknown",
          type: "unknown", // TODO unknown because javascript! (check how this looks in typescript)
        }
        // TODO unknown because javascript! (check how this looks in typescript)
      ],
      isStatic: path.node.static,
      isAsync: path.node.async,
    });
  };

  // classic function declarations
  public FunctionDeclaration: (path) => void = (path) => {
    const targetName = path.node.id.name;
    const functionName = targetName;
    let visibility = PublicVisibility;

    this._createMaps(targetName)

    this._functionMap.get(targetName).set(functionName, {
      name: functionName,
      type: "function",
      visibility: visibility,
      isConstructor: false,
      parameters: path.node.params.map(this._extractParam),
      returnParameters: [
        {
          name: "unknown",
          type: "unknown", // TODO unknown because javascript! (check how this looks in typescript)
        }
        // TODO unknown because javascript! (check how this looks in typescript)
      ],
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
    let visibility = PublicVisibility;

    this._createMaps(targetName)

    this._functionMap.get(targetName).set(functionName, {
      name: functionName,
      type: "function",
      visibility: visibility,
      isConstructor: false,
      parameters: path.node.params.map(this._extractParam),
      returnParameters: [
        {
          name: "unknown",
          type: "unknown", // TODO unknown because javascript! (check how this looks in typescript)
        }
        // TODO unknown because javascript! (check how this looks in typescript)
      ],
      isStatic: path.node.static,
      isAsync: path.node.async,
    });
  }

  _extractParam(param: any) {
      if (param.type === 'RestElement') {
        // TODO this can actually be an infinite amount of arguments...
      }

      return {
        name: param.name || "unknown",
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
