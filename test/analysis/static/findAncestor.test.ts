import {
  BranchObjectiveFunction,
  CFG,
  Edge,
  NodeType,
  SearchSubject,
} from "../../../src";
import * as chai from "chai";
import { MockSearchSubject } from "../../mocks/MockSearchSubject.mock";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";

const expect = chai.expect;

describe("CFG ancestors search", function () {
  const cfgMini = new CFG();
  const CFG1 = new CFG();
  const CFG2 = new CFG();
  const CFG3 = new CFG();

  beforeEach(function () {
    let nodes;
    let edges;
    // Construct cfgMini
    nodes = [
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
    edges = [
      { from: "1", to: "2", branchType: true },
      { from: "1", to: "3", branchType: false },
      { from: "ROOT", to: "1" },
    ];
    cfgMini.nodes = nodes;
    cfgMini.edges = edges;

    // Construct CFG1
    for (let i = 65; i < 70; i++) {
      nodes.push({
        type: NodeType.Intermediary,
        id: String.fromCharCode(i),
        lines: [],
        statements: [],
      });
    }
    edges = [
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
    CFG1.nodes = nodes;
    CFG1.edges = edges;

    // Construct CFG2
    nodes = [
      {
        type: NodeType.Root,
        id: "ROOT",
        lines: [],
        statements: [],
      },
    ];

    for (let i = 65; i < "S".charCodeAt(0) + 1; i++) {
      nodes.push({
        type: NodeType.Intermediary,
        id: String.fromCharCode(i),
        lines: [],
        statements: [],
      });
    }
    // false branch on the picture is always on the left
    edges = [
      { from: "A", to: "B", branchType: false },
      { from: "A", to: "C", branchType: true },

      { from: "C", to: "D", branchType: false },
      { from: "C", to: "E", branchType: true },
      { from: "E", to: "A" },

      { from: "D", to: "F" },

      { from: "F", to: "G", branchType: true },
      { from: "F", to: "H", branchType: true },
      { from: "F", to: "I", branchType: true },

      { from: "G", to: "J" },

      { from: "J", to: "L", branchType: false },
      { from: "J", to: "M", branchType: true },

      { from: "H", to: "K" },

      { from: "L", to: "N" },
      { from: "M", to: "N" },

      { from: "N", to: "O" },
      { from: "K", to: "O" },
      { from: "I", to: "O" },

      { from: "O", to: "P" },
      { from: "P", to: "Q", branchType: false },
      { from: "P", to: "R", branchType: true },

      { from: "Q", to: "S" },
      { from: "R", to: "S" },

      { from: "ROOT", to: "A" },
    ];
    CFG2.nodes = nodes;
    CFG2.edges = edges;

    // Construct CFG3

    edges = [
      { from: "A", to: "B", branchType: false },
      { from: "A", to: "C", branchType: true },

      { from: "C", to: "D", branchType: false },
      { from: "C", to: "E", branchType: true },
      { from: "E", to: "S" },

      { from: "D", to: "F" },

      { from: "F", to: "G", branchType: true },
      { from: "F", to: "H", branchType: true },
      { from: "F", to: "I", branchType: true },

      { from: "G", to: "J" },

      { from: "J", to: "L", branchType: false },
      { from: "J", to: "M", branchType: true },

      { from: "H", to: "K" },

      { from: "L", to: "N" },
      { from: "M", to: "N" },

      { from: "N", to: "O" },
      { from: "K", to: "O" },
      { from: "I", to: "O" },

      { from: "O", to: "P" },
      { from: "P", to: "Q", branchType: false },
      { from: "P", to: "R", branchType: true },

      { from: "Q", to: "S" },
      { from: "R", to: "S" },

      { from: "ROOT", to: "A" },
    ];

    CFG3.nodes = nodes;
    CFG3.edges = edges;
  });

  it("1 branch", () => {
    expect(cfgMini.findClosestAncestor("2", ["ROOT", "1", "3"])).to.eql([
      1,
      cfgMini.getNodeById("1"),
    ]);
  });

  it("CFG1 Target G, Path went to F", () => {
    // Path that was covered: A -> C -> D -> F -> A -> B
    // Try to find distance from G
    expect(
      CFG1.findClosestAncestor("G", ["ROOT", "A", "C", "D", "F", "A", "B"])
    ).to.eql([1, CFG1.getNodeById("D")]);
  });

  it("CFG1 Target G, Path went to E", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find distance from G
    expect(
      CFG1.findClosestAncestor("G", ["ROOT", "A", "C", "E", "A", "B"])
    ).to.eql([2, CFG1.getNodeById("C")]);
  });

  it("CFG1 Target G, Path went to E and looped", () => {
    // Path that was covered: A -> C -> E -> A -> C -> D -> F -> A -> B
    // Try to find distance from G
    expect(
      CFG1.findClosestAncestor("G", [
        "ROOT",
        "A",
        "C",
        "E",
        "A",
        "C",
        "D",
        "F",
        "A",
        "B",
      ])
    ).to.eql([1, CFG1.getNodeById("D")]);
  });

  it("CFG1 Target E, Path went to B", () => {
    // Path that was covered: A -> B
    // Try to find distance from E
    expect(CFG1.findClosestAncestor("E", ["ROOT", "A", "B"])).to.eql([
      2,
      CFG1.getNodeById("A"),
    ]);
  });

  it("CFG1 Target F, Path went to B", () => {
    // Path that was covered: A -> B
    // Try to find distance from F
    expect(CFG1.findClosestAncestor("F", ["ROOT", "A", "B"])).to.eql([
      3,
      CFG1.getNodeById("A"),
    ]);
  });

  it("CFG2 Target E, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find distance from E
    expect(
      CFG2.findClosestAncestor("E", [
        "ROOT",
        "A",
        "C",
        "D",
        "F",
        "H",
        "K",
        "N",
        "P",
        "Q",
        "S",
      ])
    ).to.eql([1, CFG2.getNodeById("C")]);
  });

  it("CFG2 Target I, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find distance from I
    expect(
      CFG2.findClosestAncestor("I", [
        "ROOT",
        "A",
        "C",
        "D",
        "F",
        "H",
        "K",
        "N",
        "P",
        "Q",
        "S",
      ])
    ).to.eql([1, CFG2.getNodeById("F")]);
  });

  it("CFG2 Target M, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find distance from M
    expect(
      CFG2.findClosestAncestor("M", [
        "ROOT",
        "A",
        "C",
        "D",
        "F",
        "H",
        "K",
        "N",
        "P",
        "Q",
        "S",
      ])
    ).to.eql([2, CFG2.getNodeById("F")]);
  });

  it("CFG2 Target N, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find distance from N
    expect(
      CFG2.findClosestAncestor("N", [
        "ROOT",
        "A",
        "C",
        "D",
        "F",
        "H",
        "K",
        "N",
        "P",
        "Q",
        "S",
      ])
    ).to.eql([2, CFG2.getNodeById("F")]);
  });

  it("CFG2 Target R, Path went to S through H and Q", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find distance from R
    expect(
      CFG2.findClosestAncestor("R", [
        "ROOT",
        "A",
        "C",
        "D",
        "F",
        "H",
        "K",
        "N",
        "P",
        "Q",
        "S",
      ])
    ).to.eql([1, CFG2.getNodeById("P")]);
  });

  it("CFG2 Target R, Path went to E and B", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find distance from R
    expect(
      CFG2.findClosestAncestor("R", ["ROOT", "A", "C", "E", "A", "B"])
    ).to.eql([3, CFG2.getNodeById("C")]);
  });

  it("CFG2 Target S, Path went to E and B", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find distance from S
    expect(
      CFG2.findClosestAncestor("S", ["ROOT", "A", "C", "E", "A", "B"])
    ).to.eql([3, CFG2.getNodeById("C")]);
  });

  it("CFG2 Target S, Path went to B immidiately", () => {
    // Path that was covered: A -> B
    // Try to find distance from S
    expect(CFG2.findClosestAncestor("S", ["ROOT", "A", "B"])).to.eql([
      4,
      CFG2.getNodeById("A"),
    ]);
  });

  it("CFG3 Target S, Path went to B immidiately", () => {
    // Path that was covered: A -> B
    // Try to find distance from S
    expect(CFG3.findClosestAncestor("S", ["ROOT", "A", "B"])).to.eql([
      2,
      CFG3.getNodeById("A"),
    ]);
  });

  it("CFG3 Target R, Path went through E", () => {
    // Path that was covered: A -> C -> E -> S
    // Try to find distance from S
    expect(CFG3.findClosestAncestor("R", ["ROOT", "A", "C", "E", "S"])).to.eql([
      3,
      CFG3.getNodeById("C"),
    ]);
  });
});
