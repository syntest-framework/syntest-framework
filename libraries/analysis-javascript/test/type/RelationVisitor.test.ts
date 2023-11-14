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
import { RelationVisitor } from "../../lib/type/discovery/relation/RelationVisitor";

const expect = chai.expect;

function relationHelper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const result = generator.convert("", source);
  if (isFailure(result)) throw result.error;
  const ast = unwrap(result);

  const visitor = new RelationVisitor("", false);
  traverse(ast, visitor);

  return visitor.relationMap;
}

describe("RelationVisitor test", () => {
  it("Assignment", () => {
    const source = `
        const name1 = 1
      `;

    const relations = [...relationHelper(source).values()];

    expect(relations.length).to.equal(1);
  });

  it("Function", () => {
    const source = `
        function name1() {}
      `;

    const relations = [...relationHelper(source).values()];

    expect(relations.length).to.equal(1);
    expect(relations[0].involved.length).to.equal(1);
  });

  it("Function anonymous", () => {
    const source = `
        const a = function () {}
      `;

    const relations = [...relationHelper(source).values()];

    expect(relations.length).to.equal(2);
    expect(relations[0].involved.length).to.equal(2);
    expect(relations[1].involved.length).to.equal(1);
    expect(relations[1].involved[0]).to.equal(`${relations[1].id}`);
    expect(relations[0].involved[1]).to.equal(relations[1].id);
  });

  it("Function with args", () => {
    const source = `
        function name1(a, b) {}
      `;

    const relations = [...relationHelper(source).values()];

    expect(relations.length).to.equal(1);
    expect(relations[0].involved.length).to.equal(3);
  });

  it("Function with return", () => {
    const source = `
        function name1() {
          return 1
        }
      `;

    const relations = [...relationHelper(source).values()];

    expect(relations.length).to.equal(2);
    expect(relations[0].involved.length).to.equal(1);
    expect(relations[1].involved.length).to.equal(2);
    expect(relations[1].involved[0]).to.equal(relations[0].id);
  });

  // call expression
  it("Call expression no args", () => {
    const source = `
        abc()
      `;

    const relations = [...relationHelper(source).values()];

    expect(relations.length).to.equal(1);
    expect(relations[0].involved.length).to.equal(1);
  });

  it("Call expression 2 args", () => {
    const source = `
        abc(a, b)
      `;

    const relations = [...relationHelper(source).values()];

    expect(relations.length).to.equal(1);
    expect(relations[0].involved.length).to.equal(3);
  });

  // Object
  it("Object property", () => {
    const source = `
        const a = {
          b: 1
        }
      `;

    const relations = [...relationHelper(source).values()];

    expect(relations.length).to.equal(3);
    expect(relations[0].involved.length).to.equal(2);
    expect(relations[1].involved.length).to.equal(1);
    expect(relations[2].involved.length).to.equal(2);

    expect(relations[0].involved[1]).to.equal(relations[1].id);
    expect(relations[1].involved[0]).to.equal(relations[2].id);
  });
});
