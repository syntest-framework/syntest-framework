import { TestCase } from "../TestCase";
import { SuiteBuilder } from "../decoder/SuiteBuilder";
import { EncodingRunner } from "../../search/EncodingRunner";
import { ExecutionResult } from "../../search/ExecutionResult";

export interface Datapoint {
  type: string;
  locationIdx: number;
  line: number;

  hits: number;

  opcode: string;
  left: number;
  right: number;
}

export abstract class TestCaseRunner implements EncodingRunner<TestCase> {
  protected _suiteBuilder: SuiteBuilder;

  protected constructor(suiteBuilder: SuiteBuilder) {
    this._suiteBuilder = suiteBuilder;
  }

  get suiteBuilder(): SuiteBuilder {
    return this._suiteBuilder;
  }

  public abstract execute(encoding: TestCase): Promise<ExecutionResult>;
}
