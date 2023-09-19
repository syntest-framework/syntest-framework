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

describe("BranchDistance a === b test", () => {
  // number
  it("2 === 1 true", () => {
    const condition = "2 === 1";
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

  it("2 === 1 false", () => {
    const condition = "2 === 1";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("1 === 1 true", () => {
    const condition = "1 === 1";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("1 === 1 false", () => {
    const condition = "1 === 1";
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

  it("0 === -1 true", () => {
    const condition = "0 === -1";
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

  it("0 === -1 false", () => {
    const condition = "0 === -1";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  // string
  it("'a' === 'a' true", () => {
    const condition = "'a' === 'a'";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("'a' === 'a' false", () => {
    const condition = "'a' === 'a'";
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

  it("'a' === 'b' true", () => {
    const condition = "'a' === 'b'";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate(condition, variables, trueOrFalse)
    ).to.be.closeTo(0.3333, 0.001);
  });

  it("'a' === 'b' false", () => {
    const condition = "'a' === 'b'";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  // number string mix
  it("0 === '0' true", () => {
    const condition = "0 === '0'";
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

  it("0 === '0' false", () => {
    const condition = "0 === '0'";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("typeof a === 'string' true", () => {
    const condition = "typeof a === 'string'";
    const variables = {
      a: 1,
    };
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate(condition, variables, trueOrFalse)
    ).to.approximately(0.999, 0.001);
  });

  it("typeof 1 === 'string' true", () => {
    const condition = "typeof 1 === 'string'";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(
      calculator.calculate(condition, variables, trueOrFalse)
    ).to.approximately(0.999, 0.001);
  });
});
