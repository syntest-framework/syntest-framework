import { ActionStatement, EncodingSampler, Statement } from "../../src";
import { Parameter } from "../../dist";
import { TestCaseMock } from "./TestCase.mock";

export class ActionStatementMock extends ActionStatement {
  constructor(types: Parameter[], uniqueId: string, args: Statement[]) {
    super(types, uniqueId, args);
  }

  copy(): ActionStatement;
  copy(): Statement;
  copy(): ActionStatement | Statement {
    return undefined;
  }

  mutate(
    sampler: EncodingSampler<TestCaseMock>,
    depth: number
  ): ActionStatement;
  mutate(sampler: EncodingSampler<TestCaseMock>, depth: number): Statement;
  mutate(
    sampler: EncodingSampler<TestCaseMock>,
    depth: number
  ): ActionStatement | Statement {
    return undefined;
  }
}
