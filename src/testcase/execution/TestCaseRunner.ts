import { AbstractTestCase } from "../AbstractTestCase";
import { SuiteBuilder } from "../decoder/SuiteBuilder";
import { EncodingRunner } from "../../search/EncodingRunner";
import { ExecutionResult } from "../../search/ExecutionResult";
import { SearchSubject } from "../../search/SearchSubject";

export interface Datapoint {
  id: string;
  type: string;
  locationIdx: number;
  branchType: boolean;
  line: number;
  hits: number;
  opcode: string;
  left: number[];
  right: number[];
}

export abstract class TestCaseRunner
  implements EncodingRunner<AbstractTestCase> {
  protected _suiteBuilder: SuiteBuilder;

  protected constructor(suiteBuilder: SuiteBuilder) {
    this._suiteBuilder = suiteBuilder;
  }

  get suiteBuilder(): SuiteBuilder {
    return this._suiteBuilder;
  }

  public abstract execute(
    subject: SearchSubject<AbstractTestCase>,
    encoding: AbstractTestCase
  ): Promise<ExecutionResult>;
}
