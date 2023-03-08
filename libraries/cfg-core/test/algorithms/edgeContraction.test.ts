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
} from "../../lib";
import * as chai from "chai";

const expect = chai.expect;

describe("CFG edge contraction", function () {
  let cfg: ControlFlowGraph<unknown>;

  beforeEach(function () {
    // Construct cfg
    const nodes: Node<unknown>[] = [
      new Node("ROOT", NodeType.ENTRY, "ROOT", [], { lineNumbers: [] }),
      new Node("1", NodeType.NORMAL, "1", [], { lineNumbers: [] }),
      new Node("2", NodeType.NORMAL, "2", [], { lineNumbers: [] }),
      new Node("3", NodeType.NORMAL, "3", [], { lineNumbers: [] }),
      new Node("4", NodeType.NORMAL, "4", [], { lineNumbers: [] }),
      new Node("EXIT", NodeType.EXIT, "EXIT", [], { lineNumbers: [] }),
    ];
    const edges: Edge[] = [
      new Edge("1", EdgeType.NORMAL, "1", nodes[0].id, nodes[1].id),
      new Edge("2", EdgeType.TRUE, "2", nodes[1].id, nodes[2].id),
      new Edge("3", EdgeType.FALSE, "3", nodes[1].id, nodes[3].id),
      new Edge("4", EdgeType.NORMAL, "4", nodes[3].id, nodes[4].id),
      new Edge("5", EdgeType.NORMAL, "5", nodes[2].id, nodes[5].id),
      new Edge("6", EdgeType.NORMAL, "6", nodes[4].id, nodes[5].id),
    ];
    cfg = new ControlFlowGraph(nodes[0], nodes[5], nodes[5], nodes, edges);
  });

  it("Two edges should be contracted", () => {
    const contractedCFG = edgeContraction(cfg);

    expect(contractedCFG.nodes.length).to.equal(cfg.nodes.length - 2);

    expect(contractedCFG.edges.length).to.equal(cfg.edges.length - 2);
  });

  it("Two edges should be contracted", () => {
    const contractedCFG = edgeContraction(cfg);

    expect(contractedCFG.getParentNode("1")).to.equal("ROOT");

    expect(contractedCFG.getChildNodes("ROOT")).to.deep.equal(["ROOT", "1"]);
  });
});
