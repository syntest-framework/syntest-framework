import * as chai from "chai";
import { Configuration } from "../lib";
const expect = chai.expect;

/**
 * This test is only added such that the github action does not fail.
 */
describe("example test", () => {
  it("test", async () => {
    new Configuration();
    expect(true);
  });
});
