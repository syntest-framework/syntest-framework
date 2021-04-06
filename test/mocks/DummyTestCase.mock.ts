import { TestCase } from "../../src/testcase/TestCase";
import { ConstructorCall, Encoding } from "../../src";
import { BranchObjectiveFunction } from "../../src";

export class DummyIndividual extends TestCase {
  private static counter = 0;

  constructor() {
    DummyIndividual.counter++;
    const actionGene = new ConstructorCall(
      "dummy",
      "dummy",
      "dummy" + DummyIndividual.counter,
      [],
      []
    );
    super(actionGene);
  }

  public setDummyEvaluation(
    objective: BranchObjectiveFunction<TestCase>[],
    values: number[]
  ) {
    if (objective.length != values.length)
      throw new Error("Something bad happened");

    for (let i = 0; i < objective.length; i++) {
      this.setObjective(objective[i], values[i]);
    }
  }
}
