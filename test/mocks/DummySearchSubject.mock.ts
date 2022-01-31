import {
  CFG,
  ObjectiveFunction,
  SearchSubject,
  ActionDescription,
} from "../../src";
import { DummyEncodingMock } from "./TestCase.mock";
import { Parameter } from "../../dist";

export class DummySearchSubject extends SearchSubject<DummyEncodingMock> {
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
    ObjectiveFunction<DummyEncodingMock>,
    ObjectiveFunction<DummyEncodingMock>[]
  >;
  protected _paths: any;

  get cfg(): CFG {
    return undefined;
  }

  get functionMap(): any {
    return null;
  }

  getChildObjectives(
    objective: ObjectiveFunction<DummyEncodingMock>
  ): ObjectiveFunction<DummyEncodingMock>[] {
    return [];
  }

  getPath(from: string, to: string): any {
    return null;
  }

  get name(): string {
    return "";
  }

  getObjectives(): ObjectiveFunction<DummyEncodingMock>[] {
    return Array.from(this._objectives.keys());
  }

  setObjectives(objectives: ObjectiveFunction<DummyEncodingMock>[]) {
    for (const obj of objectives) {
      this._objectives.set(obj, []);
    }
  }

  getPossibleActions(
    type: string | undefined,
    returnTypes: Parameter[] | undefined
  ): ActionDescription[] {
    return [];
  }
}
