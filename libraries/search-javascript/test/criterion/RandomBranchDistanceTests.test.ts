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

describe("Random Tests", () => {
  it("a !== undefined && !b true", () => {
    const condition = "a !== undefined && !b";
    const variables = {
      b: 1,
    };
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("args false", () => {
    const condition = "args";
    const variables = {
      args: "\n",
    };
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("args false", () => {
    const condition = "args";
    const variables = {
      args: "\n",
    };
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("cmd.options.length true", () => {
    const condition = "args";
    const variables = {
      "cmd.options.length": 0,
    };
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(
      0.5
    );
  });

  it("cmd.options.length false", () => {
    const condition = "args";
    const variables = {
      "cmd.options.length": 0,
    };
    const trueOrFalse = false;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });

  it("option.defaultValue !== undefined && !option.negate true", () => {
    const condition = "option.defaultValue !== undefined && !option.negate";
    const variables: { [key: string]: null } = {
      // eslint-disable-next-line unicorn/no-null
      "option.defaultValue": null,
    };
    const trueOrFalse = true;

    const calculator = new BranchDistance(
      false,
      "0123456789abcdefghijklmnopqrstuvxyz"
    );

    expect(calculator.calculate(condition, variables, trueOrFalse)).to.equal(0);
  });
});
