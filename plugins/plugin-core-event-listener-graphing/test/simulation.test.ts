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
  ControlFlowGraph,
  Edge,
  edgeContraction,
  EdgeType,
  Node,
  NodeType,
} from "@syntest/cfg";
import * as chai from "chai";

import { createSimulation } from "../lib/D3Simulation";

const expect = chai.expect;

describe("simulationTest", () => {
  it("SimpleTest", () => {
    const nodes = new Map<string, Node>();
    const nodeRoot = new Node("ROOT", NodeType.ENTRY, "ROOT", [], {
      lineNumbers: [],
    });
    const nodeExit = new Node("EXIT", NodeType.EXIT, "EXIT", [], {
      lineNumbers: [],
    });
    nodes.set("ROOT", nodeRoot);
    nodes.set("EXIT", nodeExit);

    // Construct CFG
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
    const edges = [
      new Edge("A", EdgeType.NORMAL, "A", "ROOT", "A"),
      new Edge("B", EdgeType.CONDITIONAL_FALSE, "B", "A", "B"),
      new Edge("C", EdgeType.CONDITIONAL_TRUE, "C", "A", "C"),
      new Edge("D", EdgeType.CONDITIONAL_TRUE, "D", "C", "D"),
      new Edge("E", EdgeType.CONDITIONAL_FALSE, "E", "C", "E"),
      new Edge("F", EdgeType.CONDITIONAL_TRUE, "F", "D", "F"),
      new Edge("G", EdgeType.CONDITIONAL_FALSE, "G", "D", "G"),
      new Edge("H", EdgeType.NORMAL, "H", "F", "A"),
      new Edge("I", EdgeType.NORMAL, "I", "G", "A"),
      new Edge("J", EdgeType.NORMAL, "J", "E", "A"),
    ];
    let cfg = new ControlFlowGraph(nodeRoot, nodeExit, nodeExit, nodes, edges);
    cfg = edgeContraction(cfg);

    const svgHtml = createSimulation(cfg);

    expect(svgHtml);
  });
});
