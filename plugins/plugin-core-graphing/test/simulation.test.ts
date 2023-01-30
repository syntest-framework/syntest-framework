import * as chai from "chai";
import { CFG, NodeType } from "@syntest/cfg-core";
import { Configuration, ArgumentsObject } from "@syntest/core";
import { createSimulation } from "../lib/D3Simulation";
const expect = chai.expect;

describe("simulationTest", () => {
  it("SimpleTest", () => {
    const configuration = new Configuration();
    configuration.initialize(<ArgumentsObject>(<unknown>{}));

    const cfg: CFG = new CFG();

    const nodes = [
      {
        type: NodeType.Intermediary,
        id: "1",
        lines: [],
        statements: [],
      },
      {
        type: NodeType.Intermediary,
        id: "2",
        lines: [],
        statements: [],
      },
      {
        type: NodeType.Intermediary,
        id: "3",
        lines: [],
        statements: [],
      },
      {
        type: NodeType.Root,
        id: "ROOT",
        lines: [],
        statements: [],
      },
    ];

    // Construct CFG
    for (let i = 65; i < 70; i++) {
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
    cfg.nodes = nodes;
    cfg.edges = edges;

    createSimulation(`test`, cfg);
  });
});
