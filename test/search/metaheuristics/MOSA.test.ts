import * as chai from "chai";
import {
  guessCWD,
  loadConfig,
  processConfig,
  setupLogger,
  setupOptions,
  setUserInterface,
  CommandLineInterface,
  Properties,
  Encoding,
  EncodingRunner, EncodingSampler
} from "../../../src";
import { MOSA } from "../../../src/search/metaheuristics/evolutionary/mosa/MOSA";
import { TestCaseMock } from "../../mocks/TestCase.mock";
import { DummySearchSubject } from "../../mocks/DummySubject.mock";
import { BranchObjectiveFunction } from "../../../src";
import { MockedMOSA } from "../../mocks/MOSAAdapter";
import { DummyCrossover } from "../../mocks/DummyCrossover.mock";
import { Test } from "mocha";

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

    setUserInterface(
      new CommandLineInterface(
        Properties.console_log_level === "silent",
        Properties.console_log_level === "verbose"
      )
    );
  });

  let objectives: Set<BranchObjectiveFunction<TestCaseMock>>;

  beforeEach(function () {
    const objective1 = new BranchObjectiveFunction<TestCaseMock>(
      null,
      "1",
      1,
      true
    );
    const objective2 = new BranchObjectiveFunction<TestCaseMock>(
      null,
      "1",
      1,
      false
    );
    objectives = new Set<BranchObjectiveFunction<TestCaseMock>>();
    objectives.add(objective1);
    objectives.add(objective2);
  });

  it("Test Preference criterion", () => {
    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation(Array.from(objectives), [2, 3]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation(Array.from(objectives), [0, 2]);

    const ind3 = new TestCaseMock();
    ind3.setDummyEvaluation(Array.from(objectives), [2, 0]);

    const mockedRunner = (<EncodingRunner<TestCaseMock>>{}) as any;
    const mockedSampler = (<EncodingSampler<TestCaseMock>>{}) as any;

    const mosa = new MOSA(mockedRunner, mockedSampler, new DummyCrossover());
    const frontZero = mosa.preferenceCriterion(
      [ind1 as TestCaseMock, ind2, ind3],
      objectives
    );

    expect(frontZero.length).to.equal(2);
    expect(frontZero).to.contain(ind2);
    expect(frontZero).to.contain(ind3);
  });

  it("Test Non Dominated front", () => {
    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation(Array.from(objectives), [2, 3]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation(Array.from(objectives), [0, 2]);

    const ind3 = new TestCaseMock();
    ind3.setDummyEvaluation(Array.from(objectives), [2, 0]);

    const ind4 = new TestCaseMock();
    ind4.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind5 = new TestCaseMock();
    ind5.setDummyEvaluation(Array.from(objectives), [5, 5]);

    const mockedRunner = (<EncodingRunner<TestCaseMock>>{}) as any;
    const mockedSampler = (<EncodingSampler<TestCaseMock>>{}) as any;

    const mosa = new MOSA(mockedSampler, mockedRunner, new DummyCrossover());
    const front = mosa.getNonDominatedFront(objectives, [
      ind1,
      ind2,
      ind3,
      ind4,
      ind5,
    ]);

    expect(front.length).to.equal(3);
    expect(front).to.contain(ind2);
    expect(front).to.contain(ind3);
    expect(front).to.contain(ind4);
  });

  it("Test Preference Sorting", () => {
    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation(Array.from(objectives), [2, 3]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation(Array.from(objectives), [0, 2]);

    const ind3 = new TestCaseMock();
    ind3.setDummyEvaluation(Array.from(objectives), [2, 0]);

    const ind4 = new TestCaseMock();
    ind4.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const mockedRunner = (<EncodingRunner<TestCaseMock>>{}) as any;
    const mockedSampler = (<EncodingSampler<TestCaseMock>>{}) as any;

    const mosa = new MOSA(mockedSampler, mockedRunner, new DummyCrossover());
    const front = mosa.preferenceSortingAlgorithm(
      [ind1, ind2, ind3, ind4],
      objectives
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
    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation(Array.from(objectives), [2, 3]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation(Array.from(objectives), [0, 2]);

    const ind3 = new TestCaseMock();
    ind3.setDummyEvaluation(Array.from(objectives), [2, 0]);

    const ind4 = new TestCaseMock();
    ind4.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind5 = new TestCaseMock();
    ind5.setDummyEvaluation(Array.from(objectives), [3, 2]);

    const searchSubject = new DummySearchSubject(Array.from(objectives));

    const mockedRunner = (<EncodingRunner<TestCaseMock>>{}) as any;
    const mockedSampler = (<EncodingSampler<TestCaseMock>>{}) as any;

    const mosa = new MockedMOSA(
      mockedSampler,
      mockedRunner,
      new DummyCrossover()
    );
    mosa.setPopulation([ind1, ind2, ind3, ind4, ind5], 4);
    mosa.updateObjectives(searchSubject);
    await mosa.environmentalSelection(4);

    expect(mosa.getPopulation().length).to.equal(4);
    expect(mosa.getPopulation()).contain(ind1);
    expect(mosa.getPopulation()).contain(ind2);
    expect(mosa.getPopulation()).contain(ind3);
    expect(mosa.getPopulation()).contain(ind4);
  });
});
