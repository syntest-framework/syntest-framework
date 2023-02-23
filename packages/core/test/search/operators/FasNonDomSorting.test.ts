import * as chai from "chai";
import { BranchObjectiveFunction } from "../../../lib";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";
import { fastNonDomSorting } from "../../../lib/search/operators/ranking/FastNonDomSorting";
import { createStubInstance } from "sinon";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */
describe("Fast non-dominated sorting", function () {
  it("Sort three solutions", () => {
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
    const objectives = new Set<BranchObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);
    objectives.add(objective2);

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([objective1, objective2], [3, 3]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([objective1, objective2], [2, 0]);

    const F = fastNonDomSorting([ind1, ind2, ind3], objectives);
    expect(F[0].length).to.equal(2);
    expect(F[0]).to.contain(ind1);
    expect(F[0]).to.contain(ind3);
    expect(F[1].length).to.equal(1);
    expect(F[1]).to.contain(ind2);
  });
});
