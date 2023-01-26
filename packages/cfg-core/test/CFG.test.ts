import * as chai from "chai";
import { ControlFlowGraph, NodeType, RootNode } from "../lib";

const expect = chai.expect;

describe("CFG suite", function () {
  it("getRootNodes works properly", () => {
    const cfg = new ControlFlowGraph();
    const rootNode: RootNode = {
      type: NodeType.Root,
      id: "0",
      statements: [],
      lines: [],
    };
    cfg.nodes = [rootNode];

    expect(cfg.getRootNodes()).to.contain(rootNode);
  });
});
