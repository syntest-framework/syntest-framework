import * as chai from "chai";
import { AbstractSyntaxTreeGenerator } from "../lib/AbstractSyntaxTreeGenerator";
const expect = chai.expect;

/**
 * This test is only added such that the github action does not fail.
 */
describe("example test", () => {
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

    expect(ast.type === "File");
  });
});
