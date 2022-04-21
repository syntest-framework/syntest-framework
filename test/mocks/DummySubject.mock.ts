import {
  ObjectiveFunction,
  SearchSubject,
} from "../../src";
import { DummyCFG } from "./DummyCFG.mock";

export class DummySearchSubject extends SearchSubject<any> {
  protected objectives: ObjectiveFunction<any>[];

  constructor(objectives: ObjectiveFunction<any>[]) {
    super("", "", new DummyCFG());
    this.objectives = objectives;
  }

  getObjectives(): ObjectiveFunction<any>[] {
    return this.objectives;
  }

  protected _extractObjectives(): void {
    return;
  }

  protected _extractPaths(): void {
    // mock
  }
}
