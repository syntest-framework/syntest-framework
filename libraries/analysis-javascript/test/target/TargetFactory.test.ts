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
import { isFailure, unwrap } from "@syntest/diagnostics";
import { expect } from "chai";

import { AbstractSyntaxTreeFactory } from "../../lib/ast/AbstractSyntaxTreeFactory";
import { TargetFactory } from "../../lib/target/TargetFactory";

describe("TargetFactory", () => {
  it("class with getter and setters", () => {
    const code = `
    class Test {
        _propertyX  = "example"

        get propertyX() {
            return this._propertyX
        }
        set propertyX(propertyX) {
            this._propertyX = propertyX
        }
    }
    `;
    const result = new AbstractSyntaxTreeFactory().convert("", code);
    if (isFailure(result)) throw result.error;
    const ast = unwrap(result);

    const targetMapGenerator = new TargetFactory(false);
    const targetResult = targetMapGenerator.extract("", ast);
    if (isFailure(targetResult)) throw targetResult.error;
    const target = unwrap(targetResult);

    expect(target.subTargets.length).to.equal(3);
  });
});
