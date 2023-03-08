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
import { AbstractSyntaxTreeGenerator } from "@syntest/ast-javascript";
import { TargetMapGenerator } from "../../../../lib/analysis/static/map/TargetMapGenerator";

describe("Temp", () => {
  it("temp", () => {
    const target = "test";
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
    const ast = new AbstractSyntaxTreeGenerator().generate(code);

    const targetMapGenerator = new TargetMapGenerator();
    const { targetMap, functionMap } = targetMapGenerator.generate(target, ast);

    console.log(targetMap);
    console.log(functionMap);
  });
});
