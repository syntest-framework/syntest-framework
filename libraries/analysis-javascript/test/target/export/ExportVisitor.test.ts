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
import * as chai from "chai";

import { AbstractSyntaxTreeFactory } from "../../../lib/ast/AbstractSyntaxTreeFactory";
import { ExportVisitor } from "../../../lib/target/export/ExportVisitor";

const expect = chai.expect;

function exportHelper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const ast = generator.convert("", source);

  const visitor = new ExportVisitor("", false);

  traverse(ast, visitor);

  return visitor.exports;
}

/**
 * Test cases are based on the following documentation:
 * https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export
 */
describe("ExportVisitor test", () => {
  // export declarations
  it("export basic declaration", () => {
    const source = `export let name1, name2/*, … */; // also var`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("name1");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("name2");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("name2");
  });

  it("export initialized declaration", () => {
    const source = `export const name1 = 1, name2 = 2/*, … */; // also var, let`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("name1");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("name2");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("name2");
  });

  it("export initialized declaration renamed", () => {
    const source = `
    const x = 1;
    export const name1 = x, name2 = 2/*, … */; // also var, let`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("x");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("name2");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("name2");
  });

  it("export function declaration", () => {
    const source = `export function functionName() { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("functionName");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("functionName");
  });

  it("export class declaration", () => {
    const source = `export class ClassName { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("ClassName");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("ClassName");
  });

  it("export starred function declaration", () => {
    const source = `export function* generatorFunctionName() { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("generatorFunctionName");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("generatorFunctionName");
  });

  it("export ObjectPattern declaration", () => {
    const source = `export const { name1, name2: bar } = { name1: 1, name2: 2};`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("name1");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("name2");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("name2");
  });

  it("export ObjectPattern declaration rename", () => {
    const source = `
    const x = 1;
    const a = 2;
    export const { name1, name2: bar } = { name1: x, name2: a};`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("x");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("a");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("name2");
  });

  it("export ObjectPattern declaration to object", () => {
    const source = `export const { name1, name2: bar } = o;`;

    expect(() => exportHelper(source)).throw();
  });

  it("export ObjectPattern declaration not equal amount of properties", () => {
    const source = `export const { name1, name2 } = {name1: 1}`;

    expect(() => exportHelper(source)).throw();
  });

  it("export ObjectPattern declaration rest element", () => {
    const source = `export const { name1, ...name2 } = {name1: 1, name2: 2}`;

    expect(() => exportHelper(source)).throw();
  });

  it("export ObjectPattern declaration spread element", () => {
    const source = `export const { name1, name2 } = {name1: 1, ...o}`;

    expect(() => exportHelper(source)).throw();
  });

  it("export ObjectPattern declaration non matching props", () => {
    const source = `export const { name1, name2 } = {name1: 1, b: 2}`;

    expect(() => exportHelper(source)).throw();
  });

  it("export ArrayPattern declaration", () => {
    const source = `export const [ name1, name2 ] = [1, 2];`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("name1");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("name2");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("name2");
  });

  it("export ArrayPattern declaration rename", () => {
    const source = `
    const x = 1;
    const a = 2;
    export const [ name1, name2 ] = [x, a];`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("x");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("a");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("name2");
  });

  it("export ArrayPattern declaration to array", () => {
    const source = `export const [ name1, name2 ] = array;`;

    expect(() => exportHelper(source)).throw();
  });

  it("export ObjectPattern declaration not equal amount of properties", () => {
    const source = `export const [ name1, name2 ] = [1]`;

    expect(() => exportHelper(source)).throw();
  });

  it("export ObjectPattern declaration rest element", () => {
    const source = `export const [ name1, ...name2 ] = [1, 2]`;

    expect(() => exportHelper(source)).throw();
  });

  // list exports
  it("export basic specifier", () => {
    const source = `
    const name1 = 1
    const nameN = 2
    export { name1, /* …, */ nameN };`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("name1");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("nameN");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("nameN");
  });

  it("export named specifier", () => {
    const source = `
    const variable1 = 1
    const variable2 = 2
    const nameN = 3
    export { variable1 as name1, variable2 as name2, /* …, */ nameN };`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(3);

    expect(exports[0].name).to.equal("variable1");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("name1");

    expect(exports[1].name).to.equal("variable2");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(false);
    expect(exports[1].renamedTo).to.equal("name2");

    expect(exports[2].name).to.equal("nameN");
    expect(exports[2].default).to.equal(false);
    expect(exports[2].module).to.equal(false);
    expect(exports[2].renamedTo).to.equal("nameN");
  });

  it("export named string specifier", () => {
    const source = `
    const variable1 = 1
    export { variable1 as "string_name" };`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("variable1");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("string_name");
  });

  it("export named default specifier", () => {
    const source = `
    const name1 = 1
    export { name1 as default /*, … */ };`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("name1");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("default");
  });

  // default exports
  it("export default expression", () => {
    const source = `
    const expression = 1
    export default expression;`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("expression");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("expression");
  });

  it("export default function named", () => {
    const source = `export default function functionName() { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("functionName");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("functionName");
  });

  it("export default class named", () => {
    const source = `export default class ClassName { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("ClassName");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("ClassName");
  });

  it("export default starred function named", () => {
    const source = `export default function* generatorFunctionName() { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("generatorFunctionName");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("generatorFunctionName");
  });

  it("export default function unnamed", () => {
    const source = `export default function () { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("default");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("default");
  });

  it("export default class unnamed", () => {
    const source = `export default class { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("default");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("default");
  });

  it("export default starred function unnamed", () => {
    const source = `export default function* () { /* … */ }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("default");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("default");
  });

  it("export default const value", () => {
    const source = `export default 1`;

    expect(() => exportHelper(source)).throw();
  });

  it("export default new expression non identifier", () => {
    const source = `export default new x['a']()`;

    expect(() => exportHelper(source)).throw();
  });

  it("export default new expression", () => {
    const source = `export default new Function()`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("Function");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("Function");
  });

  // aggregate exports
  it("export all from module", () => {
    const source = `export * from "module-name";`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export all from module and rename", () => {
    const source = `export * as name1 from "module-name";`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export specific from module", () => {
    const source = `export { name1, /* …, */ nameN } from "module-name";`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export specific from module and rename", () => {
    const source = `export { import1 as name1, import2 as name2, /* …, */ nameN } from "module-name";`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export default from module", () => {
    const source = `export { default, /* …, */ } from "module-name";`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export default from module and rename", () => {
    const source = `export { default as name1 } from "module-name";`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  // module exports
  it("export module default", () => {
    const source = `module.exports = 5;`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("NumericLiteral");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("NumericLiteral");
  });

  it("export module default object", () => {
    const source = `module.exports = { a: 5, b: 5};`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("a");

    expect(exports[1].name).to.equal("b");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(true);
    expect(exports[1].renamedTo).to.equal("b");
  });

  it("export module default object no init", () => {
    const source = `
    const a = 1;
    const b = 1;
    module.exports = { a, b};`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(2);

    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("a");

    expect(exports[1].name).to.equal("b");
    expect(exports[1].default).to.equal(false);
    expect(exports[1].module).to.equal(true);
    expect(exports[1].renamedTo).to.equal("b");
  });

  it("export module default array", () => {
    const source = `
    const a = 1
    const b = 1
    module.exports = [ a, b ];`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("ArrayExpression");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("ArrayExpression");
  });

  it("export module default identifier", () => {
    const source = `
    const o = {}
    module.exports = o;`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("o");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("o");
  });

  it("export module default named function", () => {
    const source = `module.exports = function x () {};`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("x");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("x");
  });

  it("export module default unnamed function", () => {
    const source = `module.exports = function () {};`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("anonymousFunction");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("anonymousFunction");
  });

  it("export module default arrow function", () => {
    const source = `module.exports = () => {};`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("anonymousFunction");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("anonymousFunction");
  });

  it("export expression but not assignment", () => {
    const source = `module.exports`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export exports equals const", () => {
    const source = `exports = 5`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("NumericLiteral");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("NumericLiteral");
  });

  it("export exports.x equals const", () => {
    const source = `exports.x = 5`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("NumericLiteral");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("x");
  });

  it("export exports.x equals a", () => {
    const source = `
    const a = 1;
    exports.x = a`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("x");
  });

  it("export exports['x'] equals a", () => {
    const source = `
    const a = 1;
    exports['x'] = a
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("x");
  });

  it("export exports[x] equals a", () => {
    const source = `
    const a = 1;
    exports[x] = a`;

    expect(() => exportHelper(source)).throw();
  });

  it("export module.x equals a", () => {
    const source = `
    const a = 1
    module.x = a
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export module['exports'] equals a", () => {
    const source = `
    const a = 1;
    module['exports'] = a
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);
    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("a");
  });

  it("export module[exports] equals c", () => {
    const source = `
    const a = 1
    module[exports] = a
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
    // but warning should be given in the logs!
  });

  it("export module.exports.x equals a", () => {
    const source = `
    const a = 1;
    module.exports.x = a
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);
    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("x");
  });

  it("export func().x equals a", () => {
    const source = `
    const a = 5;
    func().x = a
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export module.x.x equals a", () => {
    const source = `
    const a = 5;
    module.x.x = a
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(0);
  });

  it("export module.exports['x'] equals a", () => {
    const source = `
    const a = 5;
    module.exports['x'] = a
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);
    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("x");
  });

  it("export module.exports[x] equals a", () => {
    const source = `module.exports[x] = a`;

    expect(() => exportHelper(source)).throw();
  });

  it("export exports equals object expression with object method", () => {
    const source = `exports = {a() {}}`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);
    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("a");
  });

  it("export exports equals object expression with spread element", () => {
    const source = `exports = {...a}`;

    expect(() => exportHelper(source)).throw();
  });

  it("export exports equals object expression with object property string literal", () => {
    const source = `exports = { "a": 1 }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);
    expect(exports[0].name).to.equal("a");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("a");
  });

  it("export exports equals object expression with object property number literal", () => {
    const source = `exports = { 5: 1 }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);
    expect(exports[0].name).to.equal("5");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("5");
  });

  it("export exports equals object expression with object property boolean literal", () => {
    const source = `exports = { true: 1 }`;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);
    expect(exports[0].name).to.equal("true");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("true");
  });

  it("export exports equals object expression with object property rename var", () => {
    const source = `
      const b = 1;
      exports = { a: b }
    `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);
    expect(exports[0].name).to.equal("b");
    expect(exports[0].default).to.equal(false);
    expect(exports[0].module).to.equal(true);
    expect(exports[0].renamedTo).to.equal("a");
  });

  it("export short arrow", () => {
    const source = `
    const at = (object, ...paths) => baseAt(object, baseFlatten(paths, 1))

    export default at
  `;

    const exports = exportHelper(source);

    expect(exports.length).to.equal(1);

    expect(exports[0].name).to.equal("at");
    expect(exports[0].default).to.equal(true);
    expect(exports[0].module).to.equal(false);
    expect(exports[0].renamedTo).to.equal("at");
  });
});
