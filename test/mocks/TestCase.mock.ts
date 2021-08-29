import { AbstractTestCase } from "../../src/testcase/AbstractTestCase";
import { BranchObjectiveFunction } from "../../src";
import { ActionStatementMock } from "./ActionStatement.mock";
import {EncodingSampler, Parameter, TestCaseDecoder} from "../../dist";

export class TestCaseMock extends AbstractTestCase {
  private static counter = 0;

  constructor() {
    TestCaseMock.counter++;
    const param: Parameter = {
      name: "dummy", type: "dummy"
    }

    const actionGene = new ActionStatementMock([param], "dummy", []);
    super(actionGene);
  }

  public setDummyEvaluation(
    objective: BranchObjectiveFunction<AbstractTestCase>[],
    values: number[]
  ) {
    if (objective.length != values.length)
      throw new Error("Something bad happened");

    for (let i = 0; i < objective.length; i++) {
      this.setDistance(objective[i], values[i]);
    }
  }

  copy(): AbstractTestCase {
    return null;
  }

  getLength(): number {
    return 0;
  }

  hashCode(decoder: any): number {
    return 0;
  }

  mutate(sampler: EncodingSampler<any>): AbstractTestCase {
    return undefined;
  }
}
