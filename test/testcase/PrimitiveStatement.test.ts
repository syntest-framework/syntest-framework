import * as chai from "chai";
import {
  guessCWD,
  loadConfig,
  PrimitiveStatement,
  processConfig,
  EncodingSampler,
  setupLogger,
  setupOptions,
  Encoding
} from "../../src";

const expect = chai.expect;

class dummyPrimitiveStatement extends PrimitiveStatement<string> {
  copy(): PrimitiveStatement<string> {
    return this;
  }

  mutate(sampler: EncodingSampler<Encoding>, depth: number): PrimitiveStatement<string> {
    return this;
  }
}

describe("PrimitiveStatement", () => {
  before(async () => {
    await guessCWD(null);
    await setupOptions("", "");
    await loadConfig();
    await processConfig({}, "");
    await setupLogger();
  });

  it("Primitive statements have no children", () => {
    const gene = new dummyPrimitiveStatement(
      { type: "dummyGene", name: "dummyGene" },
      "randomid",
      "randomvalue"
    );

    expect(!gene.hasChildren());
  });

  it("Primitive statements return empty children array", () => {
    const gene = new dummyPrimitiveStatement(
      { type: "dummyGene", name: "dummyGene" },
      "randomid",
      "randomvalue"
    );

    expect(gene.getChildren().length).to.equal(0);
  });

  it("Primitive statement gives correct value", () => {
    const value = "randomvalue";
    const gene = new dummyPrimitiveStatement(
      { type: "dummyGene", name: "dummyGene" },
      "randomid",
      value
    );

    expect(gene.value).to.equal(value);
  });

  it("Primitive statement gives error for getRandom function", () => {
    expect(dummyPrimitiveStatement.getRandom).throws();
  });
});
