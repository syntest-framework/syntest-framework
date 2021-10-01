import * as chai from "chai";
import { DominanceComparator } from "../../../src/search/comparators/DominanceComparator";
import {
  BranchObjectiveFunction,
  CommandLineInterface,
  guessCWD,
  loadConfig,
  processConfig,
  Properties,
  setupLogger,
  setupOptions,
  setUserInterface,
  AbstractTestCase,
} from "../../../src";
import { TestCaseMock } from "../../mocks/TestCase.mock";

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

    setUserInterface(
      new CommandLineInterface(
        Properties.console_log_level === "silent",
        Properties.console_log_level === "verbose"
      )
    );
  });

  let objectives: Set<BranchObjectiveFunction<AbstractTestCase>>;

  beforeEach(function () {
    const objective1 = new BranchObjectiveFunction<AbstractTestCase>(
      null,
      "1",
      1,
      true
    );
    const objective2 = new BranchObjectiveFunction<AbstractTestCase>(
      null,
      "1",
      1,
      false
    );
    objectives = new Set<BranchObjectiveFunction<AbstractTestCase>>();
    objectives.add(objective1);
    objectives.add(objective2);
  });

  it("Fist individual dominates", () => {
    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation(Array.from(objectives), [0, 1]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(-1);
  });

  it("Second individual dominates", () => {
    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 0]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(1);
  });

  it("None dominates with two objectives", () => {
    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(0);
  });

  it("None dominates with three objective", () => {
    const objective2 = new BranchObjectiveFunction<AbstractTestCase>(
      null,
      "2",
      1,
      false
    );
    objectives.add(objective2);

    const ind1 = new TestCaseMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 0, 1]);

    const ind2 = new TestCaseMock();
    ind2.setDummyEvaluation(Array.from(objectives), [0, 1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);
    expect(value).to.equal(0);
  });
});
