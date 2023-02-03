import * as chai from "chai";
import { DominanceComparator } from "../../../lib/search/comparators/DominanceComparator";
import {
  BranchObjectiveFunction,
  CommandLineInterface,
  setUserInterface,
} from "../../../lib";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";
import { createStubInstance } from "sinon";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */
describe("Dominance comparator", function () {
  before(() => {
    setUserInterface(createStubInstance(CommandLineInterface));
  });

  let objectives: Set<BranchObjectiveFunction<DummyEncodingMock>>;

  beforeEach(function () {
    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "1",
      1,
      true
    );
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "1",
      1,
      false
    );
    objectives = new Set<BranchObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);
    objectives.add(objective2);
  });

  it("Fist individual dominates", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation(Array.from(objectives), [0, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(-1);
  });

  it("Second individual dominates", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 0]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(1);
  });

  it("None dominates with two objectives", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(0);
  });

  it("None dominates with three objective", () => {
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "2",
      1,
      false
    );
    objectives.add(objective2);

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 0, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation(Array.from(objectives), [0, 1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);
    expect(value).to.equal(0);
  });
});