import {
  AbstractTestCase,
  Crossover,
  ActionStatement,
  EncodingSampler,
  Statement,
} from "../../src";
import {Parameter} from "../../dist";

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
    sampler: EncodingSampler<AbstractTestCase>,
    depth: number
  ): ActionStatement;
  mutate(sampler: EncodingSampler<AbstractTestCase>, depth: number): Statement;
  mutate(
    sampler: EncodingSampler<AbstractTestCase>,
    depth: number
  ): ActionStatement | Statement {
    return undefined;
  }
}
