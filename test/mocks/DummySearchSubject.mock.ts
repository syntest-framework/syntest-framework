import {
  CFG,
  ObjectiveFunction,
  SearchSubject,
  AbstractTestCase,
  ActionDescription,
} from "../../src";

export class DummySearchSubject extends SearchSubject<AbstractTestCase> {
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
    ObjectiveFunction<AbstractTestCase>,
    ObjectiveFunction<AbstractTestCase>[]
  >;
  protected _paths: any;

  get cfg(): CFG {
    return undefined;
  }

  get functionMap(): any {
    return null;
  }

  getChildObjectives(
    objective: ObjectiveFunction<AbstractTestCase>
  ): ObjectiveFunction<AbstractTestCase>[] {
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

  getObjectives(): ObjectiveFunction<AbstractTestCase>[] {
    return Array.from(this._objectives.keys());
  }

  setObjectives(objectives: ObjectiveFunction<AbstractTestCase>[]) {
    for (const obj of objectives) {
      this._objectives.set(obj, []);
    }
  }
}
