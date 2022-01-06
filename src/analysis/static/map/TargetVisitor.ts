import {
  PublicVisibility,
  PrivateVisibility,
  TargetMetaData,
} from "@syntest/framework";
import { JavaScriptFunction, ProtectedVisibility } from "./JavaScriptFunction";

export class TargetVisitor {
  private _targetMap: Map<string, TargetMetaData>;
  private _functionMap: Map<string, Map<string, JavaScriptFunction>>;

  constructor() {
    this._targetMap = new Map<string, TargetMetaData>();
    this._functionMap = new Map<string, Map<string, JavaScriptFunction>>();
  }

  public ClassDeclaration: (path) => void = (path) => {
    const targetName = path.node.id.name;

    if (!this._targetMap.has(targetName)) {
      this._targetMap.set(targetName, {
        name: targetName,
      });

      this._functionMap.set(targetName, new Map<string, JavaScriptFunction>());
    }
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
      type: functionName === "constructor" ? "constructor" : "function",
      visibility: visibility,
      isConstructor: functionName === "constructor",
      parameters: path.node.params.map((x) => {
        return {
          name: x.name,
          type: "any", // TODO unknown because javascript! (check how this looks in typescript)
        };
      }),
      returnParameters: [
        {
          name: "unknown",
          type: "any", // TODO unknown because javascript! (check how this looks in typescript)
        }
        // TODO unknown because javascript! (check how this looks in typescript)
      ],
      isStatic: path.node.static,
      isAsync: path.node.async,
    });
  };

  // TODO classic function declarations
  // FunctionDeclaration = {
  //   enter (path) {
  //     console.log('entering', path)
  //   },
  //
  //   exit (path) {
  //     console.log('exiting', path)
  //   }
  // }

  get targetMap(): Map<string, any> {
    return this._targetMap;
  }

  get functionMap(): Map<string, Map<string, any>> {
    return this._functionMap;
  }
}
