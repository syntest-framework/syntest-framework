/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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
import { expect } from "chai";
import { BranchDistance } from "../../lib/criterion/BranchDistance";

describe("BranchDistance a || b test", () => {
  // number
  it("1 || 1 true", () => {
    const condition = "1 || 1";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0);
  });

  it("1 || 0 true", () => {
    const condition = "1 || 0";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0);
  });

  it("0 || 1 true", () => {
    const condition = "0 || 1";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0);
  });

  it("0 || 0 true", () => {
    const condition = "0 || 0";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0.5);
  });

  it("1 || 1 false", () => {
    const condition = "1 || 1";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0.5);
  });

  it("1 || 0 false", () => {
    const condition = "1 || 0";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.be.closeTo(0.3333, 0.1);
  });

  it("0 || 1 false", () => {
    const condition = "0 || 1";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.be.closeTo(0.3333, 0.1);
  });

  it("0 || 0 false", () => {
    const condition = "0 || 0";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0);
  });

  // boolean
  it("true || true true", () => {
    const condition = "true || true";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0);
  });

  it("true || false true", () => {
    const condition = "true || false";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0);
  });

  it("false || true true", () => {
    const condition = "false || true";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0);
  });

  it("false || false true", () => {
    const condition = "false || false";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0.5);
  });

  it("true || true false", () => {
    const condition = "true || true";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0.5);
  });

  it("true || false false", () => {
    const condition = "true || false";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.be.closeTo(0.3333, 0.1);
  });

  it("false || true false", () => {
    const condition = "false || true";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.be.closeTo(0.3333, 0.1);
  });

  it("false || false false", () => {
    const condition = "false || false";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate("", condition, variables, trueOrFalse)
    ).to.equal(0);
  });
});
