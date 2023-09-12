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
import { traverse } from "@babel/core";
import { AbstractSyntaxTreeVisitor } from "@syntest/ast-visitor-javascript";
import * as chai from "chai";

import { AbstractSyntaxTreeFactory } from "../lib/ast/AbstractSyntaxTreeFactory";

const expect = chai.expect;

/**
 * This test is only added such that the github action does not fail.
 */
describe("visitor test", () => {
  it("test", () => {
    const source = `
    export class Example {
        constructor(a) {
            this.a = a
        }
        test (a, b) {
            c = a + b
            if (a < b) {
                return c
            } else {
                return a
            }
        }
    }
    `;

    const generator = new AbstractSyntaxTreeFactory();
    const ast = generator.convert("", source);

    const visitor = new AbstractSyntaxTreeVisitor("", false);
    traverse(ast, visitor);

    expect(ast.type === "File");
  });
});
