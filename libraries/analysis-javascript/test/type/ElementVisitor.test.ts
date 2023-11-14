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
import { Identifier } from "../../lib/type/discovery/element/Element";
import { ElementVisitor } from "../../lib/type/discovery/element/ElementVisitor";

const expect = chai.expect;

function elementHelper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const result = generator.convert("", source);
  if (isFailure(result)) throw result.error;
  const ast = unwrap(result);

  const visitor = new ElementVisitor("", false);
  traverse(ast, visitor);

  return visitor.elementMap;
}

describe("ElementVisitor test", () => {
  it("Identifiers: Block", () => {
    const source = `
        const name1 = function () {}
        const name2 = async function () {}
        const name3 = async function abc() {}
        export { name1 }
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(5);

    for (const element of elements) {
      expect(element.type).to.equal("identifier");
    }

    const name1 = elements.filter(
      (element) => (<Identifier>element).name === "name1"
    );

    expect(name1.length).to.equal(2);
    expect((<Identifier>name1[0]).bindingId).to.equal(
      (<Identifier>name1[1]).bindingId
    );
  });

  it("Identifiers: Block reuse", () => {
    const source = `
        let name1 = function () {}
        
        function a () {
          name1 = function () {}
        }
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(3);

    for (const element of elements) {
      expect(element.type).to.equal("identifier");
    }

    const name1 = elements.filter(
      (element) => (<Identifier>element).name === "name1"
    );
    expect(name1.length).to.equal(2);
    expect((<Identifier>name1[0]).bindingId).to.equal(
      (<Identifier>name1[1]).bindingId
    );
  });

  it("Identifiers: shadowing", () => {
    const source = `
      const name1 = function () {}
        
        function a () {
          const name1 = function () {}
        }
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(3);

    for (const element of elements) {
      expect(element.type).to.equal("identifier");
    }

    const name1 = elements.filter(
      (element) => (<Identifier>element).name === "name1"
    );
    expect(name1.length).to.equal(2);
    expect((<Identifier>name1[0]).bindingId).to.not.equal(
      (<Identifier>name1[1]).bindingId
    );
  });

  it("Identifiers: shadowing as function arg", () => {
    const source = `
      const name1 = function () {}
        
        function a (name1) {
        }
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(3);

    for (const element of elements) {
      expect(element.type).to.equal("identifier");
    }

    const name1 = elements.filter(
      (element) => (<Identifier>element).name === "name1"
    );
    expect(name1.length).to.equal(2);
    expect((<Identifier>name1[0]).bindingId).to.not.equal(
      (<Identifier>name1[1]).bindingId
    );
  });

  it("Literal: undefined", () => {
    const source = `
        const name1 = undefined
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("undefined");
  });

  it("Literal: string", () => {
    const source = `
        const name1 = "abc"
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("stringLiteral");
  });

  it("Literal: number", () => {
    const source = `
        const name1 = 0
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("numericalLiteral");
  });

  it("Literal: exponiated number", () => {
    const source = `
        const name1 = 1e10
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("numericalLiteral");
  });

  it("Literal: decimal number", () => {
    const source = `
        const name1 = 1_000_000_000_000
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("numericalLiteral");
  });

  it("Literal: binary number", () => {
    const source = `
        const name1 = 0b1010_0001_1000_0101
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("numericalLiteral");
  });

  it("Literal: hex number", () => {
    const source = `
        const name1 = 0xa0_b0_c0
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("numericalLiteral");
  });

  it("Literal: octal number", () => {
    const source = `
        const name1 = 0o00100
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("numericalLiteral");
  });

  it("Literal: null", () => {
    const source = `
        const name1 = null
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("nullLiteral");
  });

  it("Literal: boolean", () => {
    const source = `
        const name1 = true
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("booleanLiteral");
  });

  it("Literal: regex", () => {
    const source = `
        const name1 = /abc/
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("regExpLiteral");
  });

  it("Literal: template", () => {
    const source = `
        const name1 = \`abc\${1}\`
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(4);
    // we dont handle templates as elements but as relations
    expect(elements[0].type).to.equal("identifier");
  });

  it("Literal: bigint", () => {
    const source = `
        const name1 = 1n
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    expect(elements[0].type).to.equal("identifier");
    expect(elements[1].type).to.equal("bigIntLiteral");
  });

  it("Literal: decimal", () => {
    // TODO no clue how to test this
    // dont know what a decimal literal is in javascript
    const source = `
        const name1 = true
      `;

    const elements = [...elementHelper(source).values()];

    expect(elements.length).to.equal(2);

    // expect(elements[0].type).to.equal("identifier");
    // expect(elements[1].type).to.equal("decimalLiteral");
  });
});
