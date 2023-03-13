/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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
  ControlFlowGraph,
  Edge,
  NodeType,
  Node,
  EdgeType,
  edgeContraction,
} from "@syntest/cfg-core";
import { ApproachLevel } from "../../../lib";
import * as chai from "chai";
import { ContractedControlFlowGraph } from "@syntest/cfg-core/dist/graph/ContractedControlFlowGraph";

const expect = chai.expect;

/**
 * NOTE: these test cases assume contracted CFGs
 */
describe("CFG ancestors search", function () {
  let cfgMini: ContractedControlFlowGraph<unknown>;
  let CFG1: ContractedControlFlowGraph<unknown>;
  let CFG2: ContractedControlFlowGraph<unknown>;
  let CFG3: ContractedControlFlowGraph<unknown>;

  beforeEach(function () {
    let nodes: Node<unknown>[];
    let edges: Edge[];
    // Construct cfgMini
    nodes = [
      new Node("ROOT", NodeType.ENTRY, "ROOT", [], { lineNumbers: [] }),
      new Node("1", NodeType.NORMAL, "1", [], { lineNumbers: [] }),
      new Node("2", NodeType.NORMAL, "2", [], { lineNumbers: [] }),
      new Node("3", NodeType.NORMAL, "3", [], { lineNumbers: [] }),
      new Node("EXIT", NodeType.EXIT, "EXIT", [], { lineNumbers: [] }),
    ];
    edges = [
      new Edge("0", EdgeType.NORMAL, "0", nodes[0].id, nodes[1].id),
      new Edge("1", EdgeType.CONDITIONAL_TRUE, "1", nodes[1].id, nodes[2].id),
      new Edge("2", EdgeType.CONDITIONAL_FALSE, "2", nodes[1].id, nodes[3].id),
      new Edge("3", EdgeType.NORMAL, "3", nodes[2].id, nodes[4].id),
      new Edge("4", EdgeType.NORMAL, "4", nodes[3].id, nodes[4].id),
    ];
    cfgMini = edgeContraction(
      new ControlFlowGraph(nodes[0], nodes[4], nodes[4], nodes, edges)
    );

    // Construct CFG1
    nodes = [
      new Node("ROOT", NodeType.ENTRY, "ROOT", [], { lineNumbers: [] }),
      new Node("EXIT", NodeType.EXIT, "EXIT", [], { lineNumbers: [] }),
    ];
    for (let i = 65; i < 72; i++) {
      nodes.push(
        new Node(
          String.fromCharCode(i),
          NodeType.NORMAL,
          String.fromCharCode(i),
          [],
          { lineNumbers: [] }
        )
      );
    }
    edges = [
      new Edge(
        "0",
        EdgeType.NORMAL,
        "0",
        (<Node<unknown>>nodes.find((x) => x.id === "ROOT")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id
      ),
      new Edge(
        "1",
        EdgeType.CONDITIONAL_FALSE,
        "1",
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "B")).id
      ),
      new Edge(
        "2",
        EdgeType.CONDITIONAL_TRUE,
        "2",
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id
      ),
      new Edge(
        "3",
        EdgeType.CONDITIONAL_TRUE,
        "3",
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "D")).id
      ),
      new Edge(
        "4",
        EdgeType.CONDITIONAL_FALSE,
        "4",
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "E")).id
      ),
      new Edge(
        "5",
        EdgeType.CONDITIONAL_TRUE,
        "5",
        (<Node<unknown>>nodes.find((x) => x.id === "D")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id
      ),
      new Edge(
        "6",
        EdgeType.CONDITIONAL_FALSE,
        "6",
        (<Node<unknown>>nodes.find((x) => x.id === "D")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "G")).id
      ),
      new Edge(
        "7",
        EdgeType.NORMAL,
        "7",
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id
      ),
      new Edge(
        "8",
        EdgeType.NORMAL,
        "8",
        (<Node<unknown>>nodes.find((x) => x.id === "G")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id
      ),
      new Edge(
        "9",
        EdgeType.NORMAL,
        "9",
        (<Node<unknown>>nodes.find((x) => x.id === "E")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id
      ),
      new Edge(
        "10",
        EdgeType.NORMAL,
        "10",
        (<Node<unknown>>nodes.find((x) => x.id === "B")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "EXIT")).id
      ),
    ];
    CFG1 = edgeContraction(
      new ControlFlowGraph(nodes[0], nodes[1], nodes[1], nodes, edges)
    );

    // Construct CFG2
    nodes = [
      new Node("ROOT", NodeType.ENTRY, "ROOT", [], { lineNumbers: [] }),
      new Node("EXIT", NodeType.EXIT, "EXIT", [], { lineNumbers: [] }),
    ];

    for (let i = 65; i < "S".charCodeAt(0) + 1; i++) {
      nodes.push(
        new Node(
          String.fromCharCode(i),
          NodeType.NORMAL,
          String.fromCharCode(i),
          [],
          { lineNumbers: [] }
        )
      );
    }
    // false branch on the picture is always on the left
    edges = [
      new Edge(
        "1",
        EdgeType.CONDITIONAL_FALSE,
        "1",
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "B")).id
      ),
      new Edge(
        "2",
        EdgeType.CONDITIONAL_TRUE,
        "2",
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id
      ),
      new Edge(
        "3",
        EdgeType.CONDITIONAL_FALSE,
        "3",
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "D")).id
      ),
      new Edge(
        "4",
        EdgeType.CONDITIONAL_TRUE,
        "4",
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "E")).id
      ),
      new Edge(
        "5",
        EdgeType.NORMAL,
        "5",
        (<Node<unknown>>nodes.find((x) => x.id === "E")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id
      ),
      new Edge(
        "6",
        EdgeType.NORMAL,
        "6",
        (<Node<unknown>>nodes.find((x) => x.id === "D")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id
      ),

      new Edge(
        "7",
        EdgeType.CONDITIONAL_TRUE,
        "7",
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "G")).id
      ),
      new Edge(
        "8",
        EdgeType.CONDITIONAL_TRUE,
        "8",
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "H")).id
      ),
      new Edge(
        "9",
        EdgeType.CONDITIONAL_TRUE,
        "9",
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "I")).id
      ),
      new Edge(
        "10",
        EdgeType.NORMAL,
        "10",
        (<Node<unknown>>nodes.find((x) => x.id === "G")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "J")).id
      ),
      new Edge(
        "11",
        EdgeType.CONDITIONAL_FALSE,
        "11",
        (<Node<unknown>>nodes.find((x) => x.id === "J")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "L")).id
      ),
      new Edge(
        "12",
        EdgeType.CONDITIONAL_TRUE,
        "12",
        (<Node<unknown>>nodes.find((x) => x.id === "J")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "M")).id
      ),
      new Edge(
        "13",
        EdgeType.NORMAL,
        "13",
        (<Node<unknown>>nodes.find((x) => x.id === "H")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "K")).id
      ),
      new Edge(
        "14",
        EdgeType.NORMAL,
        "14",
        (<Node<unknown>>nodes.find((x) => x.id === "L")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "N")).id
      ),
      new Edge(
        "15",
        EdgeType.NORMAL,
        "15",
        (<Node<unknown>>nodes.find((x) => x.id === "M")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "N")).id
      ),
      new Edge(
        "16",
        EdgeType.NORMAL,
        "16",
        (<Node<unknown>>nodes.find((x) => x.id === "N")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "O")).id
      ),
      new Edge(
        "17",
        EdgeType.NORMAL,
        "17",
        (<Node<unknown>>nodes.find((x) => x.id === "K")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "O")).id
      ),
      new Edge(
        "18",
        EdgeType.NORMAL,
        "18",
        (<Node<unknown>>nodes.find((x) => x.id === "I")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "O")).id
      ),
      new Edge(
        "19",
        EdgeType.NORMAL,
        "19",
        (<Node<unknown>>nodes.find((x) => x.id === "O")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "P")).id
      ),
      new Edge(
        "20",
        EdgeType.CONDITIONAL_FALSE,
        "20",
        (<Node<unknown>>nodes.find((x) => x.id === "P")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "Q")).id
      ),
      new Edge(
        "21",
        EdgeType.CONDITIONAL_TRUE,
        "21",
        (<Node<unknown>>nodes.find((x) => x.id === "P")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "R")).id
      ),
      new Edge(
        "22",
        EdgeType.NORMAL,
        "22",
        (<Node<unknown>>nodes.find((x) => x.id === "Q")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "S")).id
      ),
      new Edge(
        "23",
        EdgeType.NORMAL,
        "23",
        (<Node<unknown>>nodes.find((x) => x.id === "R")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "S")).id
      ),
      new Edge(
        "24",
        EdgeType.NORMAL,
        "24",
        (<Node<unknown>>nodes.find((x) => x.id === "ROOT")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id
      ),
    ];
    CFG2 = edgeContraction(
      new ControlFlowGraph(nodes[0], nodes[1], nodes[1], nodes, edges)
    );

    // Construct CFG3

    edges = [
      new Edge(
        "1",
        EdgeType.CONDITIONAL_FALSE,
        "1",
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "B")).id
      ),
      new Edge(
        "2",
        EdgeType.CONDITIONAL_TRUE,
        "2",
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id
      ),
      new Edge(
        "3",
        EdgeType.CONDITIONAL_FALSE,
        "3",
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "D")).id
      ),
      new Edge(
        "4",
        EdgeType.CONDITIONAL_TRUE,
        "4",
        (<Node<unknown>>nodes.find((x) => x.id === "C")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "E")).id
      ),
      new Edge(
        "5",
        EdgeType.NORMAL,
        "5",
        (<Node<unknown>>nodes.find((x) => x.id === "E")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "S")).id
      ),
      new Edge(
        "6",
        EdgeType.NORMAL,
        "6",
        (<Node<unknown>>nodes.find((x) => x.id === "D")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id
      ),
      new Edge(
        "7",
        EdgeType.CONDITIONAL_TRUE,
        "7",
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "G")).id
      ),
      new Edge(
        "8",
        EdgeType.CONDITIONAL_TRUE,
        "8",
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "H")).id
      ),
      new Edge(
        "9",
        EdgeType.CONDITIONAL_TRUE,
        "9",
        (<Node<unknown>>nodes.find((x) => x.id === "F")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "I")).id
      ),
      new Edge(
        "10",
        EdgeType.NORMAL,
        "10",
        (<Node<unknown>>nodes.find((x) => x.id === "G")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "J")).id
      ),
      new Edge(
        "11",
        EdgeType.CONDITIONAL_FALSE,
        "11",
        (<Node<unknown>>nodes.find((x) => x.id === "J")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "L")).id
      ),
      new Edge(
        "12",
        EdgeType.CONDITIONAL_TRUE,
        "12",
        (<Node<unknown>>nodes.find((x) => x.id === "J")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "M")).id
      ),
      new Edge(
        "13",
        EdgeType.NORMAL,
        "13",
        (<Node<unknown>>nodes.find((x) => x.id === "H")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "K")).id
      ),
      new Edge(
        "14",
        EdgeType.NORMAL,
        "14",
        (<Node<unknown>>nodes.find((x) => x.id === "L")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "N")).id
      ),
      new Edge(
        "15",
        EdgeType.NORMAL,
        "15",
        (<Node<unknown>>nodes.find((x) => x.id === "M")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "N")).id
      ),
      new Edge(
        "16",
        EdgeType.NORMAL,
        "16",
        (<Node<unknown>>nodes.find((x) => x.id === "N")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "O")).id
      ),
      new Edge(
        "17",
        EdgeType.NORMAL,
        "17",
        (<Node<unknown>>nodes.find((x) => x.id === "K")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "O")).id
      ),
      new Edge(
        "18",
        EdgeType.NORMAL,
        "18",
        (<Node<unknown>>nodes.find((x) => x.id === "I")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "O")).id
      ),
      new Edge(
        "19",
        EdgeType.NORMAL,
        "19",
        (<Node<unknown>>nodes.find((x) => x.id === "O")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "P")).id
      ),
      new Edge(
        "20",
        EdgeType.CONDITIONAL_FALSE,
        "20",
        (<Node<unknown>>nodes.find((x) => x.id === "P")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "Q")).id
      ),
      new Edge(
        "21",
        EdgeType.CONDITIONAL_TRUE,
        "21",
        (<Node<unknown>>nodes.find((x) => x.id === "P")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "R")).id
      ),
      new Edge(
        "22",
        EdgeType.NORMAL,
        "22",
        (<Node<unknown>>nodes.find((x) => x.id === "Q")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "S")).id
      ),
      new Edge(
        "23",
        EdgeType.NORMAL,
        "23",
        (<Node<unknown>>nodes.find((x) => x.id === "R")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "S")).id
      ),
      new Edge(
        "24",
        EdgeType.NORMAL,
        "24",
        (<Node<unknown>>nodes.find((x) => x.id === "ROOT")).id,
        (<Node<unknown>>nodes.find((x) => x.id === "A")).id
      ),
    ];

    CFG3 = edgeContraction(
      new ControlFlowGraph(nodes[0], nodes[1], nodes[1], nodes, edges)
    );
  });

  it("1 branch", () => {
    expect(
      ApproachLevel._findClosestCoveredBranch(
        cfgMini,
        "2",
        new Set<string>(["ROOT", "1", "3", "EXIT"])
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: cfgMini.getNodeById(cfgMini.getParentNode("1")),
    });
  });

  it("CFG1 Target G, Path went to F", () => {
    // Path that was covered: A -> C -> D -> F -> A -> B
    // Try to find approachLevel from G
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG1,
        "G",
        new Set<string>(["ROOT", "A", "C", "D", "F", "A", "B", "EXIT"])
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("D")),
    });
  });

  it("CFG1 Target G, Path went to E", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find approachLevel from G
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG1,
        "G",
        new Set<string>(["ROOT", "A", "C", "E", "A", "B"])
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("C")),
    });
  });

  it("CFG1 Target G, Path went to E and looped", () => {
    // Path that was covered: A -> C -> E -> A -> C -> D -> F -> A -> B
    // Try to find approachLevel from G
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG1,
        "G",
        new Set<string>(["ROOT", "A", "C", "E", "A", "C", "D", "F", "A", "B"])
      )
    ).to.eql({
      approachLevel: 0,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("D")),
    });
  });

  it("CFG1 Target E, Path went to B", () => {
    // Path that was covered: A -> B
    // Try to find approachLevel from E
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG1,
        "E",
        new Set<string>(["ROOT", "A", "B"])
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("A")),
    });
  });

  it("CFG1 Target F, Path went to B", () => {
    // Path that was covered: A -> B
    // Try to find approachLevel from F
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG1,
        "F",
        new Set<string>(["ROOT", "A", "B"])
      )
    ).to.eql({
      approachLevel: 2,
      closestCoveredBranch: CFG1.getNodeById(CFG1.getParentNode("A")),
    });
  });

  it("CFG2 Target E, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from E
    expect(
      ApproachLevel._findClosestCoveredBranch(
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
    });
  });

  it("CFG2 Target I, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from I
    expect(
      ApproachLevel._findClosestCoveredBranch(
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
    });
  });

  it("CFG2 Target M, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from M
    expect(
      ApproachLevel._findClosestCoveredBranch(
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
    });
  });

  it("CFG2 Target N, Path went to S through H", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from N
    expect(
      ApproachLevel._findClosestCoveredBranch(
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
    });
  });

  it("CFG2 Target R, Path went to S through H and Q", () => {
    // Path that was covered: A -> C -> D -> F -> H -> K -> O -> P -> Q -> S
    // Try to find approachLevel from R
    expect(
      ApproachLevel._findClosestCoveredBranch(
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
    });
  });

  it("CFG2 Target R, Path went to E and B", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find approachLevel from R
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG2,
        "R",
        new Set<string>(["ROOT", "A", "C", "E", "A", "B"])
      )
    ).to.eql({
      approachLevel: 2,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("C")),
    });
  });

  it("CFG2 Target S, Path went to E and B", () => {
    // Path that was covered: A -> C -> E -> A -> B
    // Try to find approachLevel from S
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG2,
        "S",
        new Set<string>(["ROOT", "A", "C", "E", "A", "B"])
      )
    ).to.eql({
      approachLevel: 2,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("C")),
    });
  });

  it("CFG2 Target S, Path went to B immediately", () => {
    // Path that was covered: A -> B
    // Try to find approachLevel from S
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG2,
        "S",
        new Set<string>(["ROOT", "A", "B"])
      )
    ).to.eql({
      approachLevel: 3,
      closestCoveredBranch: CFG2.getNodeById(CFG2.getParentNode("A")),
    });
  });

  it("CFG3 Target S, Path went to B immediately", () => {
    // Path that was covered: A -> B
    // Try to find approachLevel from S
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG3,
        "S",
        new Set<string>(["ROOT", "A", "B"])
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: CFG3.getNodeById(CFG3.getParentNode("A")),
    });
  });

  it("CFG3 Target R, Path went through E", () => {
    // Path that was covered: A -> C -> E -> S
    // Try to find approachLevel from S
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG3,
        "R",
        new Set<string>(["ROOT", "A", "C", "E", "S"])
      )
    ).to.eql({
      approachLevel: 2,
      closestCoveredBranch: CFG3.getNodeById(CFG3.getParentNode("C")),
    });
  });
});
