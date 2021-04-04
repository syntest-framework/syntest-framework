import {
  CFG,
  ObjectiveFunction,
  SearchSubject,
  TestCase,
  ActionDescription,
} from "../../src";

export class DummySearchSubject extends SearchSubject<TestCase> {
  protected readonly _cfg: CFG;

  protected _extractObjectives(): void {
    // mock
  }

  protected _extractPaths(): void {
    // mock
  }

  protected readonly _functionMap: any;
  protected readonly _name: string;
  protected _objectives: Map<
    ObjectiveFunction<TestCase>,
    ObjectiveFunction<TestCase>[]
  >;
  protected _paths: any;

  get cfg(): CFG {
    return undefined;
  }

  get functionMap(): any {
    return null;
  }

  getChildObjectives(
    objective: ObjectiveFunction<TestCase>
  ): ObjectiveFunction<TestCase>[] {
    return [];
  }

  getPath(from: string, to: string): any {
    return null;
  }

  getPossibleActions(
    type: string | undefined,
    returnType: string | undefined
  ): ActionDescription[] {
    return [];
  }

  get name(): string {
    return "";
  }

  getObjectives(): ObjectiveFunction<TestCase>[] {
    return Array.from(this._objectives.keys());
  }

  setObjectives(objectives: ObjectiveFunction<TestCase>[]) {
    for (const obj of objectives) {
      this._objectives.set(obj, []);
    }
  }
}
