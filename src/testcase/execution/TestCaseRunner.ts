import { TestCase } from "../TestCase";
import { SuiteBuilder } from "../decoder/SuiteBuilder";

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
  private _suiteBuilder: SuiteBuilder;

  constructor(suiteBuilder: SuiteBuilder) {
    this._suiteBuilder = suiteBuilder;
  }

  abstract runTestCase(testCase: TestCase): Promise<Datapoint[]>;

  get suiteBuilder(): SuiteBuilder {
    return this._suiteBuilder;
  }
}
