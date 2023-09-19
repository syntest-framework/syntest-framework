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

describe("BranchDistance !a test", () => {
  // number
  it("!0 true", () => {
    const condition = "!0";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("!0 false", () => {
    const condition = "!0";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("!1 true", () => {
    const condition = "!1";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("!1 false", () => {
    const condition = "!1";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("!true true", () => {
    const condition = "!true";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("!true false", () => {
    const condition = "!true";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("!false true", () => {
    const condition = "!false";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("!false false", () => {
    const condition = "!false";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("!'a' true", () => {
    const condition = "!'a'";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate(condition, variables, trueOrFalse)
    ).to.be.closeTo(0.9999, 0.1);
  });

  it("!'a' false", () => {
    const condition = "!'a'";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });
});
