import { Fitness, Objective, Runner, Target, TestCase } from "../../src";
import { CFG } from "../../src/graph/CFG";
import { Evaluation } from "../../src/search/objective/Evaluation";

export class DummyFitness extends Fitness {
  private objectives: Objective[];

  constructor(runner: Runner, objectives: Objective[]) {
    const mockedTarget = (<Target>{}) as any; // mocking

    super(runner, mockedTarget);
    this.objectives = objectives;
  }

  async evaluateMany(population: TestCase[], objectives: Objective[]) {
    for (const individual of population) {
      const evaluation = new Evaluation();
      for (let i = 0; i < objectives.length; i++) {
        evaluation.set(objectives[i], 0);
      }

      individual.setEvaluation(evaluation);
    }
  }

  extractPaths(cfg: CFG) {}
}
