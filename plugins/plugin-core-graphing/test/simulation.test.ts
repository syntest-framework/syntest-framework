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
import * as chai from "chai";
import {
  ControlFlowGraph,
  NodeType,
  Node,
  Edge,
  EdgeType,
  edgeContraction,
} from "@syntest/cfg-core";
import { createSimulation } from "../lib/D3Simulation";
import { writeFileSync } from "fs";
const expect = chai.expect;

describe("simulationTest", () => {
  it("SimpleTest", async () => {
    const nodes = [
      new Node("ROOT", NodeType.ENTRY, "ROOT", [], { lineNumbers: [] }),
      new Node("EXIT", NodeType.EXIT, "EXIT", [], { lineNumbers: [] }),
    ];

    // Construct CFG
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
    const edges = [
      new Edge("A", EdgeType.NORMAL, "A", "ROOT", "A"),
      new Edge("B", EdgeType.FALSE, "B", "A", "B"),
      new Edge("C", EdgeType.TRUE, "C", "A", "C"),
      new Edge("D", EdgeType.TRUE, "D", "C", "D"),
      new Edge("E", EdgeType.FALSE, "E", "C", "E"),
      new Edge("F", EdgeType.TRUE, "F", "D", "F"),
      new Edge("G", EdgeType.FALSE, "G", "D", "G"),
      new Edge("H", EdgeType.NORMAL, "H", "F", "A"),
      new Edge("I", EdgeType.NORMAL, "I", "G", "A"),
      new Edge("J", EdgeType.NORMAL, "J", "E", "A"),
    ];
    let cfg = new ControlFlowGraph(nodes[0], nodes[1], nodes[1], nodes, edges);
    cfg = edgeContraction(cfg);

    const svgHtml = await createSimulation(cfg);

    expect(svgHtml);
  });
});
