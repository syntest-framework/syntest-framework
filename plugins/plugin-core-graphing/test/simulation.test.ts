import * as chai from "chai";
import { ControlFlowGraph, NodeType } from "@syntest/cfg-core";
import { createSimulation } from "../lib/D3Simulation";
const expect = chai.expect;

describe("simulationTest", () => {
  it("SimpleTest", async () => {
    const nodes = [
      {
        type: NodeType.Root,
        id: "ROOT",
        lines: [],
        statements: [],
      },
    ];

    // Construct CFG
    for (let i = 65; i < 72; i++) {
      nodes.push({
        type: NodeType.Intermediary,
        id: String.fromCharCode(i),
        lines: [],
        statements: [],
      });
    }
    const edges = [
      { from: "A", to: "B", branchType: false },
      { from: "A", to: "C", branchType: true },
      { from: "C", to: "D", branchType: true },
      { from: "C", to: "E", branchType: false },
      { from: "D", to: "F", branchType: true },
      { from: "D", to: "G", branchType: false },
      { from: "F", to: "A" },
      { from: "G", to: "A" },
      { from: "E", to: "A" },
      { from: "ROOT", to: "A" },
    ];
    const cfg = new ControlFlowGraph(nodes, edges);

    const svgHtml = await createSimulation(cfg);

    expect(svgHtml);
  });
});
