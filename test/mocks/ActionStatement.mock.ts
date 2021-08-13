import {
  AbstractTestCase,
  Crossover,
  ActionStatement,
  EncodingSampler,
  Statement,
} from "../../src";

export class ActionStatementMock extends ActionStatement {
  constructor(type: string, uniqueId: string, args: Statement[]) {
    super(type, uniqueId, args);
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
