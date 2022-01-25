import {
  CFG,
  ObjectiveFunction,
  SearchSubject,
  ActionDescription,
} from "../../src";
import { TestCaseMock } from "./TestCase.mock";
import { Parameter } from "../../dist";

export class DummySearchSubject extends SearchSubject<TestCaseMock> {
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
    ObjectiveFunction<TestCaseMock>,
    ObjectiveFunction<TestCaseMock>[]
  >;
  protected _paths: any;

  get cfg(): CFG {
    return undefined;
  }

  get functionMap(): any {
    return null;
  }

  getChildObjectives(
    objective: ObjectiveFunction<TestCaseMock>
  ): ObjectiveFunction<TestCaseMock>[] {
    return [];
  }

  getPath(from: string, to: string): any {
    return null;
  }

  get name(): string {
    return "";
  }

  getObjectives(): ObjectiveFunction<TestCaseMock>[] {
    return Array.from(this._objectives.keys());
  }

  setObjectives(objectives: ObjectiveFunction<TestCaseMock>[]) {
    for (const obj of objectives) {
      this._objectives.set(obj, []);
    }
  }

  getPossibleActions(type: string | undefined, returnTypes: Parameter[] | undefined): ActionDescription[] {
    return [];
  }
}
