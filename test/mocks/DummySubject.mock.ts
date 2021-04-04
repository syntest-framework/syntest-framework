import { ActionDescription, ObjectiveFunction, SearchSubject } from "../../src";
import { DummyCFG } from "./DummyCFG.mock";
import {TestCase} from "../../dist";

export class DummySearchSubject extends SearchSubject<any> {
  protected objectives: ObjectiveFunction<any>[];

  constructor(objectives: ObjectiveFunction<any>[]) {
    super("", new DummyCFG(), null);
    this.objectives = objectives;
  }

  getPossibleActions(type?: string, returnType?: string): ActionDescription[] {
    return [];
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
