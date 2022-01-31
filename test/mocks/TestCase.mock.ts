import { BranchObjectiveFunction } from "../../src";
import { ActionStatementMock } from "./ActionStatement.mock";
import { Encoding, EncodingSampler, Parameter } from "../../src";

export class TestCaseMock extends Encoding {
  private static counter = 0;
  private root: ActionStatementMock;

  constructor() {
    TestCaseMock.counter++;
    const param: Parameter = {
      name: "dummy",
      type: "dummy",
    };

    super();
    this.root = new ActionStatementMock([param], "dummy", []);
  }

  public setDummyEvaluation(
    objective: BranchObjectiveFunction<TestCaseMock>[],
    values: number[]
  ) {
    if (objective.length != values.length)
      throw new Error("Something bad happened");

    for (let i = 0; i < objective.length; i++) {
      this.setDistance(objective[i], values[i]);
    }
  }

  copy(): TestCaseMock {
    return null;
  }

  getLength(): number {
    return 0;
  }

  hashCode(decoder: any): number {
    return 0;
  }

  mutate(sampler: EncodingSampler<any>): TestCaseMock {
    return undefined;
  }
}
