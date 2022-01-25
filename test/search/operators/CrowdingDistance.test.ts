import * as chai from "chai";
import {
  CommandLineInterface,
  crowdingDistance,
  guessCWD,
  loadConfig,
  processConfig,
  Properties,
  setupLogger,
  setupOptions,
  setUserInterface,
} from "../../../src";
import { TestCaseMock } from "../../mocks/TestCase.mock";
import {
  BranchObjectiveFunction,
  ObjectiveFunction,
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

    setUserInterface(
      new CommandLineInterface(
        Properties.console_log_level === "silent",
        Properties.console_log_level === "verbose"
      )
    );
  });

  it("empty front", () => {
    crowdingDistance([], new Set<ObjectiveFunction<TestCaseMock>>());
  });

  it("front with one solution", () => {
    const objective = new BranchObjectiveFunction<TestCaseMock>(
      null,
      "1",
      1,
      true
    );
    const objectives = new Set<ObjectiveFunction<TestCaseMock>>();
    objectives.add(objective);

    const ind = new TestCaseMock();
    crowdingDistance([ind], objectives);
    expect(ind.getCrowdingDistance()).to.equal(2.0);
  });

  it("front with two solutions", () => {
    const objective = new BranchObjectiveFunction<TestCaseMock>(
      null,
      "1",
      1,
      true
    );
    const objectives = new Set<ObjectiveFunction<TestCaseMock>>();
    objectives.add(objective);

    const ind1 = new TestCaseMock();
    const ind2 = new TestCaseMock();

    crowdingDistance([ind1, ind2], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(2.0);
    expect(ind2.getCrowdingDistance()).to.equal(2.0);
  });

  it("Front with more than two solutions", () => {
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
    const objectives = new Set<ObjectiveFunction<TestCaseMock>>();
    objectives.add(objective1);
    objectives.add(objective2);

    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation([objective1, objective2], [2, 0]);

    const ind3 = new TestCaseMock();
    ind3.setDummyEvaluation([objective1, objective2], [1, 1]);

    crowdingDistance([ind1, ind2, ind3], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(4.0);
    expect(ind2.getCrowdingDistance()).to.equal(4.0);
    expect(ind3.getCrowdingDistance()).to.equal(2);
  });

  it("Corner case with same obj values for all individual", () => {
    const objective1 = new BranchObjectiveFunction<TestCaseMock>(
      null,
      "1",
      1,
      true
    );
    const objectives = new Set<ObjectiveFunction<TestCaseMock>>();
    objectives.add(objective1);

    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation([objective1], [1]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation([objective1], [1]);

    const ind3 = new TestCaseMock();
    ind3.setDummyEvaluation([objective1], [1]);

    crowdingDistance([ind1, ind2, ind3], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(0);
    expect(ind2.getCrowdingDistance()).to.equal(0);
    expect(ind3.getCrowdingDistance()).to.equal(0);
  });
});
