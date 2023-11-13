/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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
import {
  ContractedControlFlowGraph,
  ControlFlowGraph,
  Edge,
  edgeContraction,
  EdgeType,
  Node,
  NodeType,
} from "@syntest/cfg";
import { isFailure, unwrap } from "@syntest/diagnostics";
import * as chai from "chai";

import { ApproachLevelCalculator } from "../../../../lib/objective/heuristics/ApproachLevelCalculator";

const expect = chai.expect;

/**
 * NOTE: these test cases assume contracted CFGs
 */
describe("CFG ancestors search", function () {
  let cfgMini: ContractedControlFlowGraph;
  let CFG1: ContractedControlFlowGraph;
  let CFG2: ContractedControlFlowGraph;
  let CFG3: ContractedControlFlowGraph;
  let approachLevel: ApproachLevelCalculator;

  beforeEach(function () {
    approachLevel = new ApproachLevelCalculator();
    let nodes: Map<string, Node> = new Map();
    let edges: Edge[];

    // Construct cfgMini
    const nodeRoot = new Node("ROOT", NodeType.ENTRY, "ROOT", [], {
      lineNumbers: [],
    });
    const node1 = new Node("1", NodeType.NORMAL, "1", [], { lineNumbers: [] });
    const node2 = new Node("2", NodeType.NORMAL, "2", [], { lineNumbers: [] });
    const node3 = new Node("3", NodeType.NORMAL, "3", [], { lineNumbers: [] });
    const nodeExit = new Node("EXIT", NodeType.EXIT, "EXIT", [], {
      lineNumbers: [],
    });

    nodes.set(nodeRoot.id, nodeRoot);
    nodes.set(node1.id, node1);
    nodes.set(node2.id, node2);
    nodes.set(node3.id, node3);
    nodes.set(nodeExit.id, nodeExit);

    edges = [
      new Edge("0", EdgeType.NORMAL, "0", nodeRoot.id, node1.id),
      new Edge("1", EdgeType.CONDITIONAL_TRUE, "1", node1.id, node2.id),
      new Edge("2", EdgeType.CONDITIONAL_FALSE, "2", node1.id, node3.id),
      new Edge("3", EdgeType.NORMAL, "3", node2.id, nodeExit.id),
      new Edge("4", EdgeType.NORMAL, "4", node3.id, nodeExit.id),
    ];

    let result = edgeContraction(
      new ControlFlowGraph(nodeRoot, nodeExit, nodeExit, nodes, edges)
    );

    if (isFailure(result)) throw result.error;

    cfgMini = unwrap(result);

    // Construct CFG1
    nodes = new Map();
    nodes.set(nodeRoot.id, nodeRoot);
    nodes.set(nodeExit.id, nodeExit);

    for (let index = 65; index < 72; index++) {
      nodes.set(
        String.fromCodePoint(index),
        new Node(
          String.fromCodePoint(index),
          NodeType.NORMAL,
          String.fromCodePoint(index),
          [],
          { lineNumbers: [] }
        )
      );
    }
    edges = [
      new Edge("0", EdgeType.NORMAL, "0", "ROOT", "A"),
      new Edge("1", EdgeType.CONDITIONAL_FALSE, "1", "A", "B"),
      new Edge("2", EdgeType.CONDITIONAL_TRUE, "2", "A", "C"),
      new Edge("3", EdgeType.CONDITIONAL_TRUE, "3", "C", "D"),
      new Edge("4", EdgeType.CONDITIONAL_FALSE, "4", "C", "E"),
      new Edge("5", EdgeType.CONDITIONAL_TRUE, "5", "D", "F"),
      new Edge("6", EdgeType.CONDITIONAL_FALSE, "6", "D", "G"),
      new Edge("7", EdgeType.NORMAL, "7", "F", "A"),
      new Edge("8", EdgeType.NORMAL, "8", "G", "A"),
      new Edge("9", EdgeType.NORMAL, "9", "E", "A"),
      new Edge("10", EdgeType.NORMAL, "10", "B", "EXIT"),
    ];
    result = edgeContraction(
      new ControlFlowGraph(nodeRoot, nodeExit, nodeExit, nodes, edges)
    );

    if (isFailure(result)) throw result.error;

    CFG1 = unwrap(result);

    // Construct CFG2
    nodes = new Map();
    nodes.set(nodeRoot.id, nodeRoot);
    nodes.set(nodeExit.id, nodeExit);

    for (let index = 65; index < "S".codePointAt(0) + 1; index++) {
      nodes.set(
        String.fromCodePoint(index),
        new Node(
          String.fromCodePoint(index),
          NodeType.NORMAL,
          String.fromCodePoint(index),
          [],
          { lineNumbers: [] }
        )
      );
    }

    // false branch on the picture is always on the left
    edges = [
      new Edge("1", EdgeType.CONDITIONAL_FALSE, "1", "A", "B"),
      new Edge("2", EdgeType.CONDITIONAL_TRUE, "2", "A", "C"),
      new Edge("3", EdgeType.CONDITIONAL_FALSE, "3", "C", "D"),
      new Edge("4", EdgeType.CONDITIONAL_TRUE, "4", "C", "E"),
      new Edge("5", EdgeType.NORMAL, "5", "E", "A"),
      new Edge("6", EdgeType.NORMAL, "6", "D", "F"),

      new Edge("7", EdgeType.CONDITIONAL_TRUE, "7", "F", "G"),
      new Edge("8", EdgeType.CONDITIONAL_TRUE, "8", "F", "H"),
      new Edge("9", EdgeType.CONDITIONAL_TRUE, "9", "F", "I"),
      new Edge("10", EdgeType.NORMAL, "10", "G", "J"),
      new Edge("11", EdgeType.CONDITIONAL_FALSE, "11", "J", "L"),
      new Edge("12", EdgeType.CONDITIONAL_TRUE, "12", "J", "M"),
      new Edge("13", EdgeType.NORMAL, "13", "H", "K"),
      new Edge("14", EdgeType.NORMAL, "14", "L", "N"),
      new Edge("15", EdgeType.NORMAL, "15", "M", "N"),
      new Edge("16", EdgeType.NORMAL, "16", "N", "O"),
      new Edge("17", EdgeType.NORMAL, "17", "K", "O"),
      new Edge("18", EdgeType.NORMAL, "18", "I", "O"),
      new Edge("19", EdgeType.NORMAL, "19", "O", "P"),
      new Edge("20", EdgeType.CONDITIONAL_FALSE, "20", "P", "Q"),
      new Edge("21", EdgeType.CONDITIONAL_TRUE, "21", "P", "R"),
      new Edge("22", EdgeType.NORMAL, "22", "Q", "S"),
      new Edge("23", EdgeType.NORMAL, "23", "R", "S"),
      new Edge("24", EdgeType.NORMAL, "24", "ROOT", "A"),
    ];
    result = edgeContraction(
      new ControlFlowGraph(nodeRoot, nodeExit, nodeExit, nodes, edges)
    );

    if (isFailure(result)) throw result.error;

    CFG2 = unwrap(result);

    // Construct CFG3

    edges = [
      new Edge("1", EdgeType.CONDITIONAL_FALSE, "1", "A", "B"),
      new Edge("2", EdgeType.CONDITIONAL_TRUE, "2", "A", "C"),
      new Edge("3", EdgeType.CONDITIONAL_FALSE, "3", "C", "D"),
      new Edge("4", EdgeType.CONDITIONAL_TRUE, "4", "C", "E"),
      new Edge("5", EdgeType.NORMAL, "5", "E", "S"),
      new Edge("6", EdgeType.NORMAL, "6", "D", "F"),
      new Edge("7", EdgeType.CONDITIONAL_TRUE, "7", "F", "G"),
      new Edge("8", EdgeType.CONDITIONAL_TRUE, "8", "F", "H"),
      new Edge("9", EdgeType.CONDITIONAL_TRUE, "9", "F", "I"),
      new Edge("10", EdgeType.NORMAL, "10", "G", "J"),
      new Edge("11", EdgeType.CONDITIONAL_FALSE, "11", "J", "L"),
      new Edge("12", EdgeType.CONDITIONAL_TRUE, "12", "J", "M"),
      new Edge("13", EdgeType.NORMAL, "13", "H", "K"),
      new Edge("14", EdgeType.NORMAL, "14", "L", "N"),
      new Edge("15", EdgeType.NORMAL, "15", "M", "N"),
      new Edge("16", EdgeType.NORMAL, "16", "N", "O"),
      new Edge("17", EdgeType.NORMAL, "17", "K", "O"),
      new Edge("18", EdgeType.NORMAL, "18", "I", "O"),
      new Edge("19", EdgeType.NORMAL, "19", "O", "P"),
      new Edge("20", EdgeType.CONDITIONAL_FALSE, "20", "P", "Q"),
      new Edge("21", EdgeType.CONDITIONAL_TRUE, "21", "P", "R"),
      new Edge("22", EdgeType.NORMAL, "22", "Q", "S"),
      new Edge("23", EdgeType.NORMAL, "23", "R", "S"),
      new Edge("24", EdgeType.NORMAL, "24", "ROOT", "A"),
    ];

    result = edgeContraction(
      new ControlFlowGraph(nodeRoot, nodeExit, nodeExit, nodes, edges)
    );

    if (isFailure(result)) throw result.error;

    CFG3 = unwrap(result);
  });

  it("1 branch", () => {
    expect(
      approachLevel._findClosestCoveredBranch(
        cfgMini,
        "2",
        new Set<string>(["ROOT", "1", "3", "EXIT"])
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: cfgMini.getNodeById(cfgMini.getParentNode("1")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG1 Target G, Path went to F", () => {
    // Path that was covered: A -> C -> D -> F -> A -> B
    // Try to find approachLevel from G
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG1,
        "G",
        new Set<string>(["ROOT", "A", "C", "D", "F", "A", "B", "EXIT"])
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("D")),
      lastEdgeType: false,
      statementFraction: -1,
    });
  });

  it("CFG1 Target G, Path went to E", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find approachLevel from G
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG1,
        "G",
        new Set<string>(["ROOT", "A", "C", "E", "A", "B"])
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("C")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG1 Target G, Path went to E and looped", () => {
    // Path that was covered: A -> C -> E -> A -> C -> D -> F -> A -> B
    // Try to find approachLevel from G
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG1,
        "G",
        new Set<string>(["ROOT", "A", "C", "E", "A", "C", "D", "F", "A", "B"])
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("D")),
      lastEdgeType: false,
      statementFraction: -1,
    });
  });

  it("CFG1 Target E, Path went to B", () => {
    // Path that was covered: A -> B
    // Try to find approachLevel from E
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG1,
        "E",
        new Set<string>(["ROOT", "A", "B"])
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("A")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG1 Target F, Path went to B", () => {
    // Path that was covered: A -> B
    // Try to find approachLevel from F
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG1,
        "F",
        new Set<string>(["ROOT", "A", "B"])
      )
    ).to.eql({
      approachLevel: 2,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("A")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG2 Target E, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from E
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG2,
        "E",
        new Set<string>([
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
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("C")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG2 Target I, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from I
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG2,
        "I",
        new Set<string>([
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
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("F")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG2 Target M, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from M
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG2,
        "M",
        new Set<string>([
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
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("D")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG2 Target N, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from N
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG2,
        "N",
        new Set<string>([
          "ROOT",
          "A",
          "C",
          "D",
          "F",
          "H",
          "K",
          "O",
          "P",
          "Q",
          "S",
        ])
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("F")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG2 Target R, Path went to S through H and Q", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from R
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG2,
        "R",
        new Set<string>([
          "ROOT",
          "A",
          "C",
          "D",
          "F",
          "H",
          "K",
          "O",
          "P",
          "Q",
          "S",
        ])
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("P")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG2 Target R, Path went to E and B", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find approachLevel from R
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG2,
        "R",
        new Set<string>(["ROOT", "A", "C", "E", "A", "B"])
      )
    ).to.eql({
      approachLevel: 2,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("C")),
      lastEdgeType: false,
      statementFraction: -1,
    });
  });

  it("CFG2 Target S, Path went to E and B", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find approachLevel from S
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG2,
        "S",
        new Set<string>(["ROOT", "A", "C", "E", "A", "B"])
      )
    ).to.eql({
      approachLevel: 2,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("C")),
      lastEdgeType: false,
      statementFraction: -1,
    });
  });

  it("CFG2 Target S, Path went to B immediately", () => {
    // Path that was covered: A -> B
    // Try to find approachLevel from S
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG2,
        "S",
        new Set<string>(["ROOT", "A", "B"])
      )
    ).to.eql({
      approachLevel: 3,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("A")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG3 Target S, Path went to B immediately", () => {
    // Path that was covered: A -> B
    // Try to find approachLevel from S
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG3,
        "S",
        new Set<string>(["ROOT", "A", "B"])
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: CFG3.getNodeById(CFG3.getParentNode("A")),
      lastEdgeType: true,
      statementFraction: -1,
    });
  });

  it("CFG3 Target R, Path went through E", () => {
    // Path that was covered: A -> C -> E -> S
    // Try to find approachLevel from S
    expect(
      approachLevel._findClosestCoveredBranch(
        CFG3,
        "R",
        new Set<string>(["ROOT", "A", "C", "E", "S"])
      )
    ).to.eql({
      approachLevel: 2,
      closestCoveredBranch: CFG3.getNodeById(CFG3.getParentNode("C")),
      lastEdgeType: false,
      statementFraction: -1,
    });
  });
});
