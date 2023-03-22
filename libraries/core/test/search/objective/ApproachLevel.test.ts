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
import { ControlFlowGraph, NodeType } from "@syntest/cfg-core";
import * as chai from "chai";

import { ApproachLevel } from "../../..";

const expect = chai.expect;

describe("CFG ancestors search", function () {
  let cfgMini: ControlFlowGraph;
  let CFG1: ControlFlowGraph;
  let CFG2: ControlFlowGraph;
  let CFG3: ControlFlowGraph;

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
    cfgMini = new ControlFlowGraph(nodes, edges);

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
    CFG1 = new ControlFlowGraph(nodes, edges);

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
    CFG2 = new ControlFlowGraph(nodes, edges);

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

    CFG3 = new ControlFlowGraph(nodes, edges);
  });

  it("1 branch", () => {
    expect(
      ApproachLevel._findClosestCoveredBranch(
        cfgMini,
        "2",
        new Set<string>(["ROOT", "1", "3"])
      )
    ).to.eql({
      approachLevel: 1,
      closestCoveredBranch: cfgMini.getNodeById("1"),
    });
  });

  it("CFG1 Target G, Path went to F", () => {
    // Path that was covered: A -> C -> D -> F -> A -> B
    // Try to find approachLevel from G
    expect(
      ApproachLevel._findClosestCoveredBranch(
        CFG1,
        "G",
        new Set<string>(["ROOT", "A", "C", "D", "F", "A", "B"])
      )
    ).to.eql({ approachLevel: 1, closestCoveredBranch: CFG1.getNodeById("D") });
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
    ).to.eql({ approachLevel: 2, closestCoveredBranch: CFG1.getNodeById("C") });
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
    ).to.eql({ approachLevel: 1, closestCoveredBranch: CFG1.getNodeById("D") });
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
      approachLevel: 2,
      closestCoveredBranch: CFG1.getNodeById("A"),
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
      approachLevel: 3,
      closestCoveredBranch: CFG1.getNodeById("A"),
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
    ).to.eql({ approachLevel: 1, closestCoveredBranch: CFG2.getNodeById("C") });
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
    ).to.eql({ approachLevel: 1, closestCoveredBranch: CFG2.getNodeById("F") });
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
    ).to.eql({ approachLevel: 2, closestCoveredBranch: CFG2.getNodeById("F") });
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
          "N",
          "P",
          "Q",
          "S",
        ])
      )
    ).to.eql({ approachLevel: 2, closestCoveredBranch: CFG2.getNodeById("F") });
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
          "N",
          "P",
          "Q",
          "S",
        ])
      )
    ).to.eql({ approachLevel: 1, closestCoveredBranch: CFG2.getNodeById("P") });
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
    ).to.eql({ approachLevel: 3, closestCoveredBranch: CFG2.getNodeById("C") });
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
    ).to.eql({ approachLevel: 3, closestCoveredBranch: CFG2.getNodeById("C") });
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
      approachLevel: 4,
      closestCoveredBranch: CFG2.getNodeById("A"),
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
      approachLevel: 2,
      closestCoveredBranch: CFG3.getNodeById("A"),
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
      approachLevel: 3,
      closestCoveredBranch: CFG3.getNodeById("C"),
    });
  });
});
