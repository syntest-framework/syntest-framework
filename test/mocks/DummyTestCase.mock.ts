import { Evaluation } from "../../src/search/objective/Evaluation";
import { TestCase } from "../../src/testcase/TestCase";
import { ConstructorCall, Objective } from "../../src";

export class DummyIndividual extends TestCase {
  private static counter = 0;

  constructor() {
    DummyIndividual.counter++;
    const actionGene = new ConstructorCall(
      "dummy",
      "dummy",
      "dummy" + DummyIndividual.counter,
      []
    );
    super(actionGene);
  }

  public setDummyEvaluation(objective: Objective[], values: number[]) {
    const evaluation = new Evaluation();

    if (objective.length != values.length)
      throw new Error("Something bad happened");

    for (let i = 0; i < objective.length; i++) {
      evaluation.set(objective[i], values[i]);
    }

    return this.setEvaluation(evaluation);
  }
}
