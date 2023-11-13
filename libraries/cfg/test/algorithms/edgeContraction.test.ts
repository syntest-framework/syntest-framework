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
import { isFailure, isSuccess, unwrap } from "@syntest/diagnostics";
import * as chai from "chai";

import { edgeContraction } from "../../lib/algorithms/edgeContraction";
import { ControlFlowGraph } from "../../lib/graph/ControlFlowGraph";
import { Edge } from "../../lib/graph/Edge";
import { EdgeType } from "../../lib/graph/EdgeType";
import { Node } from "../../lib/graph/Node";
import { NodeType } from "../../lib/graph/NodeType";

const expect = chai.expect;

describe("CFG edge contraction", function () {
  let cfg: ControlFlowGraph;

  beforeEach(function () {
    // Construct cfg
    const nodes = new Map<string, Node>();

    const nodeRoot = new Node("ROOT", NodeType.ENTRY, "ROOT", [], {
      lineNumbers: [],
    });
    const node1 = new Node("1", NodeType.NORMAL, "1", [], { lineNumbers: [] });
    const node2 = new Node("2", NodeType.NORMAL, "2", [], { lineNumbers: [] });
    const node3 = new Node("3", NodeType.NORMAL, "3", [], { lineNumbers: [] });
    const node4 = new Node("4", NodeType.NORMAL, "4", [], { lineNumbers: [] });
    const nodeExit = new Node("EXIT", NodeType.EXIT, "EXIT", [], {
      lineNumbers: [],
    });

    nodes.set("ROOT", nodeRoot);
    nodes.set("1", node1);
    nodes.set("2", node2);
    nodes.set("3", node3);
    nodes.set("4", node4);
    nodes.set("EXIT", nodeExit);

    const edges: Edge[] = [
      new Edge("1", EdgeType.NORMAL, "1", "ROOT", "1"),
      new Edge("2", EdgeType.CONDITIONAL_TRUE, "2", "1", "2"),
      new Edge("3", EdgeType.CONDITIONAL_FALSE, "3", "1", "3"),
      new Edge("4", EdgeType.NORMAL, "4", "3", "4"),
      new Edge("5", EdgeType.NORMAL, "5", "2", "EXIT"),
      new Edge("6", EdgeType.NORMAL, "6", "4", "EXIT"),
    ];
    cfg = new ControlFlowGraph(nodeRoot, nodeExit, nodeExit, nodes, edges);
  });

  it("One edge should be contracted", () => {
    const result = edgeContraction(cfg);

    expect(isSuccess(result)).to.be.true;

    if (isFailure(result)) throw result.error;

    const contractedCFG = unwrap(result);

    expect(contractedCFG.nodes.size).to.equal(cfg.nodes.size - 1);

    expect(contractedCFG.edges.length).to.equal(cfg.edges.length - 1);
  });

  it("One edge should be contracted", () => {
    const result = edgeContraction(cfg);

    expect(isSuccess(result)).to.be.true;

    if (isFailure(result)) throw result.error;

    const contractedCFG = unwrap(result);

    expect(contractedCFG.getParentNode("4")).to.equal("3");

    expect(contractedCFG.getChildNodes("3")).to.deep.equal(["3", "4"]);
  });
});
