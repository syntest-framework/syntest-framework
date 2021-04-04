import * as chai from "chai";
import { DominanceComparator } from "../../../src/search/comparators/DominanceComparator";
import {
  BranchObjectiveFunction,
  guessCWD,
  loadConfig,
  ObjectiveFunction,
  processConfig,
  setupLogger,
  setupOptions,
  TestCase,
} from "../../../src";
import { DummyIndividual } from "../../mocks/DummyTestCase.mock";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */
describe("Dominance comparator", function () {
  before(async () => {
    await guessCWD(null);
    await setupOptions("", "");
    await loadConfig();
    await processConfig({}, "");
    await setupLogger();
  });

  let objectives: Set<BranchObjectiveFunction<TestCase>>;

  beforeEach(function () {
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
    objectives = new Set<BranchObjectiveFunction<TestCase>>();
    objectives.add(objective1);
    objectives.add(objective2);
  });

  it("Fist individual dominates", () => {
    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation(Array.from(objectives), [0, 1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(-1);
  });

  it("Second individual dominates", () => {
    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 0]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(1);
  });

  it("None dominates with two objectives", () => {
    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(0);
  });

  it("None dominates with three objective", () => {
    const objective2 = new BranchObjectiveFunction<TestCase>(
      null,
      "2",
      1,
      1,
      false
    );
    objectives.add(objective2);

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 0, 1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation(Array.from(objectives), [0, 1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);
    expect(value).to.equal(0);
  });
});
