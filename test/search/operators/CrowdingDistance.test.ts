import * as chai from "chai";
import {
  crowdingDistance,
  guessCWD,
  loadConfig,
  processConfig,
  setupLogger,
  setupOptions,
} from "../../../src";
import { DummyIndividual } from "../../mocks/DummyTestCase.mock";
import {
  BranchObjectiveFunction,
  ObjectiveFunction,
  TestCase,
} from "../../../src";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */

describe("Crowding distance", function () {
  beforeEach(async () => {
    await guessCWD(null);
    await setupOptions("", "");
    await loadConfig();
    await processConfig({}, "");
    await setupLogger();
  });

  it("empty front", () => {
    crowdingDistance([], new Set<ObjectiveFunction<TestCase>>());
  });

  it("front with one solution", () => {
    const objective = new BranchObjectiveFunction<TestCase>(
      null,
      "1",
      1,
      1,
      true
    );
    const objectives = new Set<ObjectiveFunction<TestCase>>();
    objectives.add(objective);

    const ind = new DummyIndividual();
    crowdingDistance([ind], objectives);
    expect(ind.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
  });

  it("front with two solutions", () => {
    const objective = new BranchObjectiveFunction<TestCase>(
      null,
      "1",
      1,
      1,
      true
    );
    const objectives = new Set<ObjectiveFunction<TestCase>>();
    objectives.add(objective);

    const ind1 = new DummyIndividual();
    const ind2 = new DummyIndividual();

    crowdingDistance([ind1, ind2], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
    expect(ind2.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
  });

  it("Front with more than two solutions", () => {
    const objective1 = new BranchObjectiveFunction<TestCase>(
      null,
      "1",
      1,
      1,
      true
    );
    const objective2 = new BranchObjectiveFunction<TestCase>(
      null,
      "1",
      1,
      1,
      false
    );
    const objectives = new Set<ObjectiveFunction<TestCase>>();
    objectives.add(objective1);
    objectives.add(objective2);

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [2, 0]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [1, 1]);

    crowdingDistance([ind1, ind2, ind3], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
    expect(ind2.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
    expect(ind3.getCrowdingDistance()).to.equal(2);
  });

  it("Corner case with same obj values for all individual", () => {
    const objective1 = new BranchObjectiveFunction<TestCase>(
      null,
      "1",
      1,
      1,
      true
    );
    const objectives = new Set<ObjectiveFunction<TestCase>>();
    objectives.add(objective1);

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1], [1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1], [1]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1], [1]);

    crowdingDistance([ind1, ind2, ind3], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(0);
    expect(ind2.getCrowdingDistance()).to.equal(0);
    expect(ind3.getCrowdingDistance()).to.equal(0);
  });
});
