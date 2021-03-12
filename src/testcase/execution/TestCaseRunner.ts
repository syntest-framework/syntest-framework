import { SuiteBuilder } from "../../testbuilding/SuiteBuilder";
import { TestCase } from "../TestCase";

export interface Datapoint {
  type: string;
  locationIdx: number;
  line: number;

  hits: number;

  opcode: string;
  left: number;
  right: number;
}

export abstract class TestCaseRunner {
  get suiteBuilder(): SuiteBuilder {
    return this._suiteBuilder;
  }

  private _suiteBuilder: SuiteBuilder;

  constructor(suiteBuilder: SuiteBuilder) {
    this._suiteBuilder = suiteBuilder;
  }

  abstract runTest(individual: TestCase): Promise<Datapoint[]>;
}
