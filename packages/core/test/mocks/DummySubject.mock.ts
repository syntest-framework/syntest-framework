import { Encoding, ObjectiveFunction, SearchSubject } from "../../lib";
import { DummyCFG } from "./DummyCFG.mock";

export class DummySearchSubject<T extends Encoding> extends SearchSubject<T> {
  protected objectives: ObjectiveFunction<T>[];

  constructor(objectives: ObjectiveFunction<T>[]) {
    super("", "", new DummyCFG());
    this.objectives = objectives;
  }

  getObjectives(): ObjectiveFunction<T>[] {
    return this.objectives;
  }

  protected _extractObjectives(): void {
    return;
  }

  protected _extractPaths(): void {
    // mock
  }
}
