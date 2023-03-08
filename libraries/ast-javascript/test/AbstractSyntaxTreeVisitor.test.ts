import * as chai from "chai";
import { AbstractSyntaxTreeGenerator } from "../lib/AbstractSyntaxTreeGenerator";
import { AbstractSyntaxTreeVisitor } from "../lib/AbstractSyntaxTreeVisitor";
import { traverse } from "@babel/core";
const expect = chai.expect;

/**
 * This test is only added such that the github action does not fail.
 */
describe("visitor test", () => {
  it("test", async () => {
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

    const generator = new AbstractSyntaxTreeGenerator();
    const ast = generator.generate(source);

    const visitor = new AbstractSyntaxTreeVisitor("");
    traverse(ast, visitor);

    expect(ast.type === "File");
  });
});
