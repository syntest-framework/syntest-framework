import { Encoding, ObjectiveFunction, SearchSubject } from "../../src";
import { DummyCFG } from "./DummyCFG.mock";

export class MockSearchSubject<T extends Encoding> extends SearchSubject<T> {
  protected objectives: ObjectiveFunction<T>[];

  constructor(objectives: ObjectiveFunction<T>[], cfg: DummyCFG) {
    super("", "", cfg);
    this.objectives = objectives;
  }

  getObjectives(): ObjectiveFunction<T>[] {
    return this.objectives;
  }

  protected _extractObjectives(): void {
    return;
  }

  getPathMatrix(): Object {
    return this._paths;
  }
}
