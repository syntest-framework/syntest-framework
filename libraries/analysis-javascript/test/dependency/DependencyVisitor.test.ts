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
import { traverse } from "@babel/core";
import { isFailure, unwrap } from "@syntest/diagnostics";
import * as chai from "chai";

import { AbstractSyntaxTreeFactory } from "../../lib/ast/AbstractSyntaxTreeFactory";
import { DependencyVisitor } from "../../lib/dependency/DependencyVisitor";

const expect = chai.expect;

function dependencyHelper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const result = generator.convert("", source);
  if (isFailure(result)) throw result.error;
  const ast = unwrap(result);

  const visitor = new DependencyVisitor("", false);
  traverse(ast, visitor);

  return visitor.imports;
}

describe("TargetVisitor test", () => {
  it("basic import", () => {
    const source = `
        import { name1 } from 'module1';
      `;

    const imports = dependencyHelper(source);

    expect(imports.size).to.equal(1);
    expect(imports.has("module1")).to.equal(true);
  });

  it("basic import default", () => {
    const source = `
        import name1 from 'module1';
      `;

    const imports = dependencyHelper(source);

    expect(imports.size).to.equal(1);
    expect(imports.has("module1")).to.equal(true);
  });

  it("require import default", () => {
    const source = `
        const name1 = require('module1');
      `;

    const imports = dependencyHelper(source);

    expect(imports.size).to.equal(1);
    expect(imports.has("module1")).to.equal(true);
  });

  it("require import default scoped", () => {
    const source = `
        if (true) {
          const name1 = require('module1');
        }
      `;

    const imports = dependencyHelper(source);

    expect(imports.size).to.equal(1);
    expect(imports.has("module1")).to.equal(true);
  });

  it("require import default duplicate", () => {
    const source = `
        const name1 = require('module1');
        const name2 = require('module1');
      `;

    const imports = dependencyHelper(source);

    expect(imports.size).to.equal(1);
    expect(imports.has("module1")).to.equal(true);
  });

  it("require import default computed", () => {
    const source = `
        const name1 = require(x);
      `;

    expect(dependencyHelper(source)).to.deep.equal(new Set());
  });

  it("basic dynamic import default computed", () => {
    const source = `
        const name1 = import(x);
      `;

    expect(dependencyHelper(source)).to.deep.equal(new Set());
  });

  it("basic dynamic import default computed", () => {
    const source = `
        const name1 = import('module1');
      `;

    const imports = dependencyHelper(source);

    expect(imports.size).to.equal(1);
    expect(imports.has("module1")).to.equal(true);
  });
});
