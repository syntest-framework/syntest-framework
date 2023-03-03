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

import { BranchNode, ControlFlowGraph, NodeType, RootNode, Node } from "../lib";

const expect = chai.expect;

describe("CFG suite", function () {
  it("filterNodesOfType test", () => {
    const rootNode0: RootNode = {
      type: NodeType.Root,
      id: "0",
      statements: [],
      lines: [],
    };
    const rootNode1: RootNode = {
      type: NodeType.Root,
      id: "1",
      statements: [],
      lines: [],
    };
    const branchNode: BranchNode = {
      type: NodeType.Branch,
      id: "2",
      statements: [],
      lines: [],
      probe: true,
      condition: {
        type: "some operation type",
        operator: "+",
      },
    };
    const cfg = new ControlFlowGraph([rootNode0, rootNode1, branchNode], []);

    expect(cfg.filterNodesOfType(NodeType.Root))
      .to.deep.contain(rootNode0)
      .to.contain(rootNode1);
    expect(cfg.filterNodesOfType(NodeType.Branch)).to.deep.contain(branchNode);
  });

  it("findNodeByPredicate test", () => {
    const rootNode0: RootNode = {
      type: NodeType.Root,
      id: "0",
      statements: [],
      lines: [32],
    };
    const rootNode1: RootNode = {
      type: NodeType.Root,
      id: "1",
      statements: [],
      lines: [26],
    };
    const branchNode: BranchNode = {
      type: NodeType.Branch,
      id: "2",
      statements: [],
      lines: [],
      probe: true,
      condition: {
        type: "some operation type",
        operator: "+",
      },
    };
    const cfg = new ControlFlowGraph([rootNode0, rootNode1, branchNode], []);

    expect(cfg.findNodeByPredicate((n: Node) => n.id === "2")).to.deep.equal(
      branchNode
    );
    expect(
      cfg.findNodeByPredicate((n: Node) => n.lines.includes(26))
    ).to.deep.equal(rootNode1);
  });

  it("filterNodesByPredicates test", () => {
    const rootNode0: RootNode = {
      type: NodeType.Root,
      id: "0",
      statements: [],
      lines: [26],
    };
    const rootNode1: RootNode = {
      type: NodeType.Root,
      id: "1",
      statements: [],
      lines: [26],
    };
    const branchNode: BranchNode = {
      type: NodeType.Branch,
      id: "2",
      statements: [],
      lines: [],
      probe: true,
      condition: {
        type: "some operation type",
        operator: "+",
      },
    };
    const cfg = new ControlFlowGraph([rootNode0, rootNode1, branchNode], []);

    expect(
      cfg.filterNodesByPredicates((n: Node) => n.id === "2")
    ).to.deep.equal([branchNode]);
    expect(
      cfg.filterNodesByPredicates((n: Node) => n.lines.includes(26))
    ).to.deep.equal([rootNode0, rootNode1]);
    expect(
      cfg.filterNodesByPredicates(
        (n: Node) => n.lines.includes(26),
        (n: Node) => n.type === NodeType.Root
      )
    ).to.deep.equal([rootNode0, rootNode1]);
    expect(
      cfg.filterNodesByPredicates(
        (n: Node) => n.lines.includes(26),
        (n: Node) => n.id === "1"
      )
    ).to.deep.equal([rootNode1]);
  });

  it("getNodeById test", () => {
    const rootNode0: RootNode = {
      type: NodeType.Root,
      id: "0",
      statements: [],
      lines: [26],
    };
    const rootNode1: RootNode = {
      type: NodeType.Root,
      id: "1",
      statements: [],
      lines: [26],
    };
    const branchNode: BranchNode = {
      type: NodeType.Branch,
      id: "2",
      statements: [],
      lines: [],
      probe: true,
      condition: {
        type: "some operation type",
        operator: "+",
      },
    };
    const cfg = new ControlFlowGraph([rootNode0, rootNode1, branchNode], []);

    expect(cfg.getNodeById("2")).to.deep.equal(branchNode);
    expect(cfg.getNodeById("1")).to.deep.equal(rootNode1);
    expect(cfg.getNodeById("0")).to.deep.equal(rootNode0);
    expect(cfg.getNodeById("3")).to.deep.equal(undefined);
  });

  it("filterNodesByLineNumbers test", () => {
    const rootNode0: RootNode = {
      type: NodeType.Root,
      id: "0",
      statements: [],
      lines: [26],
    };
    const rootNode1: RootNode = {
      type: NodeType.Root,
      id: "1",
      statements: [],
      lines: [26],
    };
    const branchNode: BranchNode = {
      type: NodeType.Branch,
      id: "2",
      statements: [],
      lines: [26, 32],
      probe: true,
      condition: {
        type: "some operation type",
        operator: "+",
      },
    };
    const cfg = new ControlFlowGraph([rootNode0, rootNode1, branchNode], []);

    expect(cfg.filterNodesByLineNumbers(new Set<number>([26]))).to.deep.equal([
      rootNode0,
      rootNode1,
      branchNode,
    ]);
    expect(cfg.filterNodesByLineNumbers(new Set<number>([27]))).to.deep.equal(
      []
    );
    expect(cfg.filterNodesByLineNumbers(new Set<number>([32]))).to.deep.equal([
      branchNode,
    ]);
    expect(
      cfg.filterNodesByLineNumbers(new Set<number>([26, 32]))
    ).to.deep.equal([rootNode0, rootNode1, branchNode]);
  });

  it("findNodeOfTypeByLine test", () => {
    const rootNode0: RootNode = {
      type: NodeType.Root,
      id: "0",
      statements: [],
      lines: [26],
    };
    const rootNode1: RootNode = {
      type: NodeType.Root,
      id: "1",
      statements: [],
      lines: [26],
    };
    const branchNode: BranchNode = {
      type: NodeType.Branch,
      id: "2",
      statements: [],
      lines: [26, 32],
      probe: true,
      condition: {
        type: "some operation type",
        operator: "+",
      },
    };
    const cfg = new ControlFlowGraph([rootNode0, rootNode1, branchNode], []);

    expect(cfg.findNodeOfTypeByLine(26, NodeType.Root)).to.deep.equal(
      rootNode0
    );
    expect(cfg.findNodeOfTypeByLine(32, NodeType.Root)).to.deep.equal(
      undefined
    );
    expect(cfg.findNodeOfTypeByLine(26, NodeType.Placeholder)).to.deep.equal(
      undefined
    );
    expect(cfg.findNodeOfTypeByLine(26, NodeType.Branch)).to.deep.equal(
      branchNode
    );
    expect(cfg.findNodeOfTypeByLine(32, NodeType.Branch)).to.deep.equal(
      branchNode
    );
    expect(cfg.findNodeOfTypeByLine(27, NodeType.Branch)).to.deep.equal(
      undefined
    );
  });
});
