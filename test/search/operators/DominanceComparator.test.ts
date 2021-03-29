import * as chai from "chai";
import { DominanceComparator } from "../../../src/search/comparators/DominanceComparator";
import {
  guessCWD,
  loadConfig,
  Objective,
  processConfig,
  setupLogger,
  setupOptions,
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

  it("Fist individual dominates", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [1, 1]);

    const set = new Set<Objective>();
    set.add(objective1);
    set.add(objective2);
    const value = DominanceComparator.compare(ind1, ind2, set);

    expect(value).to.equal(-1);
  });

  it("Second individual dominates", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [1, 1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [1, 0]);

    const set = new Set<Objective>();
    set.add(objective1);
    set.add(objective2);
    const value = DominanceComparator.compare(ind1, ind2, set);

    expect(value).to.equal(1);
  });

  it("None dominates with two objectives", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [1, 1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [1, 1]);

    const set = new Set<Objective>();
    set.add(objective1);
    set.add(objective2);

    const value = DominanceComparator.compare(ind1, ind2, set);

    expect(value).to.equal(0);
  });

  it("None dominates with three objective", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };
    const objective3: Objective = { target: "mock", line: 1, locationIdx: 3 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2, objective3], [1, 0, 1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2, objective3], [0, 1, 1]);

    const set = new Set<Objective>();
    set.add(objective1);
    set.add(objective2);
    set.add(objective3);

    const value = DominanceComparator.compare(ind1, ind2, set);
    expect(value).to.equal(0);
  });
});
