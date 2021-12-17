import { CFG, Encoding, FunctionDescription, Parameter, PublicVisibility, SearchSubject } from "@syntest/framework";
import { JavaScriptFunction } from "../analysis/static/map/JavaScriptFunction";


export class JavaScriptSubject<T extends Encoding> extends SearchSubject<T> {

  constructor(
    path: string,
    name: string,
    cfg: CFG,
    functions: FunctionDescription[]
  ) {
    super(path, name, cfg, functions);
  }

  protected _extractObjectives(): void {
    // TODO create branch objectives
  }

  getPossibleActions(
    type?: string,
    returnTypes?: Parameter[]
  ): JavaScriptFunction[] {
    return this.functions.filter((f) => {
      if (returnTypes) {
        if (returnTypes.length !== f.returnParameters.length) {
          return false;
        }
        for (let i = 0; i < returnTypes.length; i++) {
          if (returnTypes[i].type !== f.returnParameters[i].type) {
            return false;
          }
        }
      }
      return ((type === undefined || f.type === type) &&
        (f.visibility === PublicVisibility) &&
        f.name !== "" // fallback function has no name
      );
    });
  }

}
