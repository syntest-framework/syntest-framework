/*
 * Copyright 2020-2023 SynTest contributors
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

import { BranchDistanceCalculator } from "../../lib/criterion/BranchDistance";

describe("BranchDistance string functions", () => {
  // endsWith
  it("'abc'.endsWith('bc') true", () => {
    const condition = "'abc'.endsWith('bc')";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("'abc'.endsWith('bc') false", () => {
    const condition = "'abc'.endsWith('bc')";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("'abc'.endsWith('z') true", () => {
    const condition = "'abc'.endsWith('z')";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.closeTo(
      0.4888,
      0.001
    ); // two changes of 1 diff?
  });

  it("'abc'.endsWith('z') false", () => {
    const condition = "'abc'.endsWith('z')";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  // includes
  it("'abc'.includes('b') true", () => {
    const condition = "'abc'.includes('b')";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("'abc'.includes('b') false", () => {
    const condition = "'abc'.includes('b')";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("'abc'.includes('z') true", () => {
    const condition = "'abc'.includes('z')";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.closeTo(
      0.4897,
      0.001
    );
  });

  it("'cab'.includes('z') true", () => {
    const condition = "'cab'.includes('z')";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.closeTo(
      0.4897,
      0.001
    );
  });

  it("'bca'.includes('z') true", () => {
    const condition = "'bca'.includes('z')";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.closeTo(
      0.4897,
      0.001
    );
  });

  it("'abc'.includes('z') false", () => {
    const condition = "'abc'.includes('z')";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  // startsWith
  it("'abc'.startsWith('ab') true", () => {
    const condition = "'abc'.startsWith('ab')";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("'abc'.startsWith('ab') false", () => {
    const condition = "'abc'.startsWith('ab')";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("'abc'.startsWith('z') true", () => {
    const condition = "'abc'.startsWith('z')";
    const variables = {};
    const trueOrFalse = true;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.closeTo(
      0.4888,
      0.001
    ); // two changes of 1 diff?
  });

  it("'abc'.startsWith('z') false", () => {
    const condition = "'abc'.startsWith('z')";
    const variables = {};
    const trueOrFalse = false;

    const calculator = new BranchDistanceCalculator(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  // TODO
  // at
  // charAt // same as at?
  // charCodeAt
  // codePointAt
  // concat
  // fromCharCode
  // fromCodePoint
  // indexOf
  // isWellFormed
  // lastIndexOf
  // localeCompare
  // match
  // matchAll
  // normalize
  // padEnd
  // padStart
  // raw
  // repeat
  // replace
  // replaceAll
  // search
  // slice
  // split
  // substring
  // toLocaleLowerCase
  // toLocaleUpperCase
  // toLowerCase
  // toString
  // toUpperCase
  // toWellFormed
  // trim
  // trimEnd
  // trimStart
  // valueOf
});
