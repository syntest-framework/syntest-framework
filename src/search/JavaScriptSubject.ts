import { CFG, Encoding, FunctionDescription, Parameter, SearchSubject } from "@syntest/framework";
import { JavaScriptFunction } from "../analysis/static/map/JavaScriptFunction";


export class JavaScriptSubject<T extends Encoding> extends SearchSubject<T> {

  constructor(
    path: string,
    name: string,
    cfg: CFG,
    functionMap: FunctionDescription[]
  ) {
    super(path, name, cfg, functionMap);
  }

  protected _extractObjectives(): void {
  }

  getPossibleActions(
    type?: string,
    returnTypes?: Parameter[]
  ): JavaScriptFunction[] {
    return [];
  }

}
