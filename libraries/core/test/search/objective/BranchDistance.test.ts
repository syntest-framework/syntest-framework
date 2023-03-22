/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as chai from "chai";

import { BranchDistance } from "../../..";

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
