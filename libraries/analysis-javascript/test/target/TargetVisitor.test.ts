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
import { TargetType } from "@syntest/analysis";
import * as chai from "chai";

import { AbstractSyntaxTreeFactory } from "../../lib/ast/AbstractSyntaxTreeFactory";
import { ExportVisitor } from "../../lib/target/export/ExportVisitor";
import {
  ClassTarget,
  FunctionTarget,
  MethodTarget,
  ObjectFunctionTarget,
  ObjectTarget,
  SubTarget,
} from "../../lib/target/Target";
import { TargetVisitor } from "../../lib/target/TargetVisitor";

const expect = chai.expect;

function targetHelper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const ast = generator.convert("", source);

  const exportVisitor = new ExportVisitor("", true);
  traverse(ast, exportVisitor);
  const exports = exportVisitor.exports;

  const visitor = new TargetVisitor("", true, exports);
  traverse(ast, visitor);

  return visitor.subTargets;
}

function checkFunction(
  target: SubTarget,
  name: string,
  exported: boolean,
  isAsync: boolean
): void {
  expect(target.type).to.equal(TargetType.FUNCTION);

  const functionTarget = <FunctionTarget>target;

  expect(functionTarget.name).to.equal(name);
  expect(functionTarget.exported).to.equal(exported);
  expect(functionTarget.isAsync).to.equal(isAsync);
}

function checkObject(target: SubTarget, name: string, exported: boolean): void {
  expect(target.type).to.equal(TargetType.OBJECT);

  const objectTarget = <ObjectTarget>target;

  expect(objectTarget.name).to.equal(name);
  expect(objectTarget.exported).to.equal(exported);
}

function checkObjectFunction(
  target: SubTarget,
  name: string,
  objectId: string,
  isAsync: boolean
): void {
  expect(target.type).to.equal(TargetType.OBJECT_FUNCTION);

  const functionTarget = <ObjectFunctionTarget>target;

  expect(functionTarget.name).to.equal(name);
  expect(functionTarget.objectId).to.equal(objectId);
  expect(functionTarget.isAsync).to.equal(isAsync);
}

function checkClass(target: SubTarget, name: string, exported: boolean): void {
  expect(target.type).to.equal(TargetType.CLASS);

  const classTarget = <ClassTarget>target;

  expect(classTarget.name).to.equal(name);
  expect(classTarget.exported).to.equal(exported);
}

function checkClassMethod(
  target: SubTarget,
  name: string,
  classId: string,
  methodType: string,
  visibility: string,
  isStatic: boolean,
  isAsync: boolean
): void {
  expect(target.type).to.equal(TargetType.METHOD);

  const methodTarget = <MethodTarget>target;

  expect(methodTarget.name).to.equal(name);
  expect(methodTarget.classId).to.equal(classId);
  expect(methodTarget.methodType).to.equal(methodType);
  expect(methodTarget.visibility).to.equal(visibility);
  expect(methodTarget.isStatic).to.equal(isStatic);
  expect(methodTarget.isAsync).to.equal(isAsync);
}

describe("TargetVisitor test", () => {
  it("FunctionExpression: tree functions one exported", () => {
    const source = `
        const name1 = function () {}
        const name2 = async function () {}
        const name3 = async function abc() {}
        export { name1 }
      `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(3);

    checkFunction(targets[0], "name1", true, false);
    checkFunction(targets[1], "name2", false, true);
    checkFunction(targets[2], "name3", false, true);
  });

  it("FunctionExpression: functions overwritten", () => {
    const source = `
          let name1 = function () {}
          name1 = async function () {}
          export { name1 }
        `;

    const targets = targetHelper(source);
    expect(targets.length).to.equal(1);

    checkFunction(targets[0], "name1", true, true);
  });

  it("FunctionExpression: functions overwritten in subscope", () => {
    // TODO we cannot know which one is actually exported (async or not)
    const source = `
          let name1 = function () {}

          if (true) {
            name1 = async function () {}
          }
          
          export { name1 }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(1);

    checkFunction(targets[0], "name1", true, true);
  });

  it("FunctionDeclaration: two functions one exported", () => {
    const source = `
          function name1() {}
          function name2() {}
          export { name1 }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(2);

    checkFunction(targets[0], "name1", true, false);
    checkFunction(targets[1], "name2", false, false);
  });

  it("ClassExpression: one exported", () => {
    const source = `
          const x = class name1 {}
          export { x }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(1);

    checkClass(targets[0], "x", true);
  });

  it("ClassDeclaration: one exported", () => {
    const source = `
          class name1 {}
          export { name1 }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(1);

    checkClass(targets[0], "name1", true);
  });

  it("ClassMethod:", () => {
    const source = `
          class name1 {
            constructor() {}
            method1() {}
            static method2() {}
            async method3() {}
            static async method4() {}

            _prop1 = 1

            get prop1() {
                return this._prop1
            }
            set prop1(value) {
                this._prop1 = value
            }
          }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(8);

    checkClass(targets[0], "name1", false);
    checkClassMethod(
      targets[1],
      "constructor",
      targets[0].id,
      "constructor",
      "public",
      false,
      false
    );
    checkClassMethod(
      targets[2],
      "method1",
      targets[0].id,
      "method",
      "public",
      false,
      false
    );
    checkClassMethod(
      targets[3],
      "method2",
      targets[0].id,
      "method",
      "public",
      true,
      false
    );
    checkClassMethod(
      targets[4],
      "method3",
      targets[0].id,
      "method",
      "public",
      false,
      true
    );
    checkClassMethod(
      targets[5],
      "method4",
      targets[0].id,
      "method",
      "public",
      true,
      true
    );
    checkClassMethod(
      targets[6],
      "prop1",
      targets[0].id,
      "get",
      "public",
      false,
      false
    );
    checkClassMethod(
      targets[7],
      "prop1",
      targets[0].id,
      "set",
      "public",
      false,
      false
    );
  });

  it("ArrowFunctionExpression: const", () => {
    const source = `
          const x = () => {}
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(1);

    checkFunction(targets[0], "x", false, false);
  });

  it("ArrowFunctionExpression: as class property", () => {
    const source = `
          class name1 {
            method1 = () => {}
        }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(2);

    checkClass(targets[0], "name1", false);
    checkClassMethod(
      targets[1],
      "method1",
      targets[0].id,
      "method",
      "public",
      false,
      false
    );
  });

  it("ArrowFunctionExpression: as default class property", () => {
    const source = `
          export default class {
            method1 = () => {}
        }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(2);

    checkClass(targets[0], "default", true);
    checkClassMethod(
      targets[1],
      "method1",
      targets[0].id,
      "method",
      "public",
      false,
      false
    );
  });

  it("ArrowFunctionExpression: as class expression property", () => {
    const source = `
          const name1 = class name2 {
            method1 = () => {}
        }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(2);

    checkClass(targets[0], "name1", false);
    checkClassMethod(
      targets[1],
      "method1",
      targets[0].id,
      "method",
      "public",
      false,
      false
    );
  });

  it("ArrowFunctionExpression: as class expression property where class expression is in object", () => {
    const source = `
        const obj = { 
            name1: class name2 {
                method1 = () => {}
            }
        }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(3);

    checkObject(targets[0], "obj", false);
    checkClass(targets[1], "name1", false);
    checkClassMethod(
      targets[2],
      "method1",
      targets[1].id,
      "method",
      "public",
      false,
      false
    );
  });

  it("ArrowFunctionExpression: as class expression property where class expression is in object using literal", () => {
    const source = `
        const obj = { 
            "name1": class name2 {
                method1 = () => {}
            }
        }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(3);

    checkObject(targets[0], "obj", false);
    checkClass(targets[1], "name1", false);
    checkClassMethod(
      targets[2],
      "method1",
      targets[1].id,
      "method",
      "public",
      false,
      false
    );
  });

  it("ArrowFunctionExpression: as class expression property where class expression is in object using literal", () => {
    const source = `
        const obj = { 
            "name1": class name2 {
                method1 = () => {}
            }
        }
        exports = obj
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(3);

    checkObject(targets[0], "obj", true);
    checkClass(targets[1], "name1", false);
    checkClassMethod(
      targets[2],
      "method1",
      targets[1].id,
      "method",
      "public",
      false,
      false
    );
  });

  it("FunctionExpression: assignment computed", () => {
    const source = `
        const x = {}
        x[y] = function name1() {}
        `;
    const targets = targetHelper(source);

    expect(targets.length).to.equal(1);
  });

  it("FunctionExpression: assignment memberexpression", () => {
    const source = `
        const x = {}
        x.y = function name1() {}
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(2);

    checkObject(targets[0], "x", false);
    checkObjectFunction(targets[1], "y", targets[0].id, false);
  });

  it("ObjectFunction: assignment memberexpression using literal two", () => {
    const source = `
        const x = {}
        x['y'] = function name1() {}
        x['z'] = async () => {}
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(3);

    checkObject(targets[0], "x", false);
    checkObjectFunction(targets[1], "y", targets[0].id, false);
    checkObjectFunction(targets[2], "z", targets[0].id, true);
  });

  it("ObjectFunction: assignment memberexpression using literal with export", () => {
    const source = `
        const x = {}
        x['y'] = function name1() {}
        export { x }
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(2);

    checkObject(targets[0], "x", true);
    checkObjectFunction(targets[1], "y", targets[0].id, false);
  });

  it("ObjectFunction: assignment memberexpression using literal with module export", () => {
    const source = `
        const x = {}
        x['y'] = function name1() {}
        module.exports = x
        `;

    const targets = targetHelper(source);

    expect(targets.length).to.equal(2);

    checkObject(targets[0], "x", true);
    checkObjectFunction(targets[1], "y", targets[0].id, false);
  });
});
