import {
  BranchDistance,
  ObjectiveFunction,
  AbstractTestCase,
} from "../../../src";
import * as chai from "chai";

const expect = chai.expect;

describe("Branch distance", function () {
  it("Equality", () => {
    let value = BranchDistance.branchDistanceNumeric(
      "EQ",
      [10, 11],
      [10, 12],
      true
    );

    expect(value).to.equal(0);

    value = BranchDistance.branchDistanceNumeric(
      "EQ",
      [10, 11],
      [10, 11],
      false
    );
    expect(value).to.equal(0.5);
  });

  it("Lower Than", () => {
    let value = BranchDistance.branchDistanceNumeric(
      "LT",
      [11, 9],
      [10, 10],
      true
    );

    expect(value).to.equal(0);

    value = BranchDistance.branchDistanceNumeric("LT", [9, 9], [12, 10], false);
    expect(value).to.equal(0.5);
  });

  it("Greater Than", () => {
    let value = BranchDistance.branchDistanceNumeric(
      "GT",
      [9, 11],
      [10, 10],
      true
    );

    expect(value).to.equal(0);

    value = BranchDistance.branchDistanceNumeric(
      "GT",
      [12, 11],
      [10, 10],
      false
    );
    expect(value).to.equal(0.5);
  });

  it("Signed Lower Than", () => {
    let value = BranchDistance.branchDistanceNumeric(
      "SLT",
      [11, 9],
      [10, 10],
      true
    );

    expect(value).to.equal(0);

    value = BranchDistance.branchDistanceNumeric(
      "SLT",
      [9, 9],
      [12, 10],
      false
    );
    expect(value).to.equal(0.5);
  });

  it("Signed Greater Than", () => {
    let value = BranchDistance.branchDistanceNumeric(
      "SGT",
      [9, 11],
      [10, 10],
      true
    );

    expect(value).to.equal(0);

    value = BranchDistance.branchDistanceNumeric(
      "SGT",
      [12, 11],
      [10, 10],
      false
    );
    expect(value).to.equal(0.5);
  });

  it("Not Equal", () => {
    let value = BranchDistance.branchDistanceNumeric(
      "NEQ",
      [11, 10],
      [10, 10],
      true
    );

    expect(value).to.equal(0);

    value = BranchDistance.branchDistanceNumeric(
      "NEQ",
      [11, 11],
      [10, 10],
      false
    );
    expect(value).to.equal(0.5);
  });
});
