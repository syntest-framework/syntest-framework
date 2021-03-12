import * as chai from "chai";
import {
  Fitness,
  guessCWD,
  loadConfig,
  NSGA2,
  Objective,
  processConfig,
  TestCaseRunner,
  Sampler,
  setupLogger,
  setupOptions,
} from "../../../src";
import { DummyTarget } from "../../mocks/DummyTarget.mock";
import { DummyFitness } from "../../mocks/DummyFitness.mock";
import { DummyIndividual } from "../../mocks/DummyTestCase.mock";

const expect = chai.expect;

/**
 * @author Dimitri Stallenberg
 */
describe("Test COMIX", function () {
  before(async () => {
    await guessCWD(null);
    await setupOptions("", "");
    await loadConfig();
    await processConfig({}, "");
    await setupLogger();
  });
  it("Test if Special argument succeeds", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [2, 3]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [2, 0]);

    const mockedRunner = (<TestCaseRunner>{}) as any;
    const mockedSampler = (<Sampler>{}) as any;
    const mockedTarget = new DummyTarget([objective1, objective2]);
    const fitness: Fitness = new DummyFitness(mockedRunner, [
      objective1,
      objective2,
    ]);

    const nsga2 = new NSGA2(mockedTarget, fitness, mockedSampler);
    //let ga = new COMIX([], fitness, mockedSampler, nsga2)

    //ga.search((alg) => alg.currentGeneration > 10)
  });
});
