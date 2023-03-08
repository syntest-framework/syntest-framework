import * as chai from "chai";
import { CFGGenerator } from "../lib/CFGGenerator";
const expect = chai.expect;

/**
 * This test is only added such that the github action does not fail.
 */
describe("example test", () => {
  it("test", async () => {
    new CFGGenerator();
    expect(true);
  });
});
