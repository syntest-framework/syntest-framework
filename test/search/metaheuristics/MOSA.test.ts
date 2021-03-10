import * as chai from "chai";
import {
  Fitness,
  guessCWD,
  loadConfig,
  Objective,
  processConfig,
  Runner,
  Sampler,
  setupLogger,
  setupOptions,
} from "../../../src";
import { MOSA } from "../../../src/search/metaheuristics/MOSA";
import { DummyIndividual } from "../../mocks/DummyTestCase.mock";
import { DummyFitness } from "../../mocks/DummyFitness.mock";
import { DummyTarget } from "../../mocks/DummyTarget.mock";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */
describe("Test MOSA", function () {
  before(async () => {
    await guessCWD(null);
    await setupOptions("", "");
    await loadConfig();
    await processConfig({}, "");
    await setupLogger();
  });

  it("Test Preference criterion", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [2, 3]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [2, 0]);

    const mockedRunner = (<Runner>{}) as any;
    const mockedSampler = (<Sampler>{}) as any;
    const mockedTarget = new DummyTarget([objective1, objective2]);
    const fitness: Fitness = new DummyFitness(mockedRunner, [
      objective1,
      objective2,
    ]);

    const mosa = new MOSA(mockedTarget, fitness, mockedSampler);
    const frontZero = mosa.preferenceCriterion(
      [ind1, ind2, ind3],
      [objective1, objective2]
    );

    expect(frontZero.length).to.equal(2);
    expect(frontZero).to.contain(ind2);
    expect(frontZero).to.contain(ind3);
  });

  it("Test Non Dominated front", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [2, 3]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [2, 0]);

    const ind4 = new DummyIndividual();
    ind4.setDummyEvaluation([objective1, objective2], [1, 1]);

    const ind5 = new DummyIndividual();
    ind5.setDummyEvaluation([objective1, objective2], [5, 5]);

    const mockedRunner = (<Runner>{}) as any;
    const mockedSampler = (<Sampler>{}) as any;
    const mockedTarget = new DummyTarget([objective1, objective2]);
    const fitness: Fitness = new DummyFitness(mockedRunner, [
      objective1,
      objective2,
    ]);

    const mosa = new MOSA(mockedTarget, fitness, mockedSampler);
    const front = mosa.getNonDominatedFront(
      [objective1, objective2],
      [ind1, ind2, ind3, ind4, ind5]
    );

    expect(front.length).to.equal(3);
    expect(front).to.contain(ind2);
    expect(front).to.contain(ind3);
    expect(front).to.contain(ind4);
  });

  it("Test Preference Sorting", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [2, 3]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [2, 0]);

    const ind4 = new DummyIndividual();
    ind4.setDummyEvaluation([objective1, objective2], [1, 1]);

    const mockedRunner = (<Runner>{}) as any;
    const mockedSampler = (<Sampler>{}) as any;
    const mockedTarget = new DummyTarget([objective1, objective2]);
    const fitness: Fitness = new DummyFitness(mockedRunner, [
      objective1,
      objective2,
    ]);

    const mosa = new MOSA(mockedTarget, fitness, mockedSampler);
    const front = mosa.preferenceSortingAlgorithm(
      [ind1, ind2, ind3, ind4],
      [objective1, objective2]
    );

    expect(front[0].length).to.equal(2);
    expect(front[0]).to.contain(ind2);
    expect(front[0]).to.contain(ind3);
    expect(front[1].length).to.equal(1);
    expect(front[1]).to.contain(ind4);
    expect(front[2].length).to.equal(1);
    expect(front[2]).to.contain(ind1);
  });

  it("Environmental Selection", async () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [2, 3]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [2, 0]);

    const ind4 = new DummyIndividual();
    ind4.setDummyEvaluation([objective1, objective2], [1, 1]);

    const ind5 = new DummyIndividual();
    ind4.setDummyEvaluation([objective1, objective2], [3, 2]);

    const mockedRunner = (<Runner>{}) as any;
    const mockedSampler = (<Sampler>{}) as any;
    const mockedTarget = new DummyTarget([objective1, objective2]);
    const fitness: Fitness = new DummyFitness(mockedRunner, [
      objective1,
      objective2,
    ]);

    const mosa = new MOSA(mockedTarget, fitness, mockedSampler);
    const newPopulation = await mosa.environmentalSelection(
      [ind1, ind2, ind3, ind4, ind5],
      4
    );

    expect(newPopulation.length).to.equal(4);
    expect(newPopulation).contain(ind1);
    expect(newPopulation).contain(ind2);
    expect(newPopulation).contain(ind3);
    expect(newPopulation).contain(ind4);
  });
});
