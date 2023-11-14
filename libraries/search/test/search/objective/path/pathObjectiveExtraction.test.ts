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
  contractControlFlowProgram,
  ControlFlowGraph,
  Edge,
  EdgeType,
  Node,
  NodeType,
} from "@syntest/cfg";
import * as chai from "chai";

import { ApproachLevelCalculator } from "../../../../lib/objective/heuristics/ApproachLevelCalculator";
import { extractPathObjectivesFromProgram } from "../../../../lib/objective/path/pathObjectiveExtraction";
import { DummyBranchDistanceCalculator } from "../../../mocks/DummyBranchDistance.mock";

const expect = chai.expect;

describe("CFG ancestors search", function () {
  it("1 branch", () => {
    const nodes: Map<string, Node> = new Map();

    const nodeEntry = new Node("ENTRY", NodeType.ENTRY, "ENTRY", [], {
      lineNumbers: [],
    });
    const node1 = new Node("1", NodeType.NORMAL, "1", [], { lineNumbers: [] });
    const node2 = new Node("2", NodeType.NORMAL, "2", [], { lineNumbers: [] });
    const node3 = new Node("3", NodeType.NORMAL, "3", [], { lineNumbers: [] });
    const nodeExit = new Node("EXIT", NodeType.EXIT, "EXIT", [], {
      lineNumbers: [],
    });

    nodes.set(nodeEntry.id, nodeEntry);
    nodes.set(node1.id, node1);
    nodes.set(node2.id, node2);
    nodes.set(node3.id, node3);
    nodes.set(nodeExit.id, nodeExit);

    const edges = [
      new Edge("0", EdgeType.NORMAL, "0", nodeEntry.id, node1.id),
      new Edge("1", EdgeType.CONDITIONAL_TRUE, "1", node1.id, node2.id),
      new Edge("2", EdgeType.CONDITIONAL_FALSE, "2", node1.id, node3.id),
      new Edge("3", EdgeType.NORMAL, "3", node2.id, nodeExit.id),
      new Edge("4", EdgeType.NORMAL, "4", node3.id, nodeExit.id),
    ];

    const cfg = new ControlFlowGraph(
      nodeEntry,
      nodeExit,
      nodeExit,
      nodes,
      edges
    );

    const cfp = contractControlFlowProgram({
      graph: cfg,
      functions: [
        {
          id: "test",
          name: "test",
          graph: cfg,
        },
      ],
    });

    const pathObjectives = extractPathObjectivesFromProgram(
      cfp,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator()
    );

    expect(pathObjectives.length).to.equal(2);
  });

  it("2 branch", () => {
    const nodes: Map<string, Node> = new Map();

    const nodeEntry = new Node("ENTRY", NodeType.ENTRY, "ENTRY", [], {
      lineNumbers: [],
    });
    const conditionNode1 = new Node("1", NodeType.NORMAL, "1", [], {
      lineNumbers: [],
    });
    const trueNode1 = new Node("2", NodeType.NORMAL, "2", [], {
      lineNumbers: [],
    });
    const falseNode1 = new Node("3", NodeType.NORMAL, "3", [], {
      lineNumbers: [],
    });
    const conditionNode2 = new Node("4", NodeType.NORMAL, "3", [], {
      lineNumbers: [],
    });
    const trueNode2 = new Node("5", NodeType.NORMAL, "5", [], {
      lineNumbers: [],
    });
    const falseNode2 = new Node("6", NodeType.NORMAL, "6", [], {
      lineNumbers: [],
    });
    const nodeExit = new Node("EXIT", NodeType.EXIT, "EXIT", [], {
      lineNumbers: [],
    });

    nodes.set(nodeEntry.id, nodeEntry);
    nodes.set(conditionNode1.id, conditionNode1);
    nodes.set(trueNode1.id, trueNode1);
    nodes.set(falseNode1.id, falseNode1);
    nodes.set(conditionNode2.id, conditionNode2);
    nodes.set(trueNode2.id, trueNode2);
    nodes.set(falseNode2.id, falseNode2);
    nodes.set(nodeExit.id, nodeExit);

    const edges = [
      new Edge("0", EdgeType.NORMAL, "0", nodeEntry.id, conditionNode1.id),
      new Edge(
        "1",
        EdgeType.CONDITIONAL_TRUE,
        "1",
        conditionNode1.id,
        trueNode1.id
      ),
      new Edge(
        "2",
        EdgeType.CONDITIONAL_FALSE,
        "2",
        conditionNode1.id,
        falseNode1.id
      ),
      new Edge("3", EdgeType.NORMAL, "3", trueNode1.id, conditionNode2.id),
      new Edge("4", EdgeType.NORMAL, "4", falseNode1.id, conditionNode2.id),
      new Edge(
        "5",
        EdgeType.CONDITIONAL_TRUE,
        "5",
        conditionNode2.id,
        trueNode2.id
      ),
      new Edge(
        "6",
        EdgeType.CONDITIONAL_FALSE,
        "6",
        conditionNode2.id,
        falseNode2.id
      ),
      new Edge("7", EdgeType.NORMAL, "7", trueNode2.id, nodeExit.id),
      new Edge("8", EdgeType.NORMAL, "8", falseNode2.id, nodeExit.id),
    ];

    const cfg = new ControlFlowGraph(
      nodeEntry,
      nodeExit,
      nodeExit,
      nodes,
      edges
    );

    const cfp = contractControlFlowProgram({
      graph: cfg,
      functions: [
        {
          id: "test",
          name: "test",
          graph: cfg,
        },
      ],
    });

    const pathObjectives = extractPathObjectivesFromProgram(
      cfp,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator()
    );

    expect(pathObjectives.length).to.equal(4);
  });

  it("2 branch nested", () => {
    const nodes: Map<string, Node> = new Map();

    const nodeEntry = new Node("ENTRY", NodeType.ENTRY, "ENTRY", [], {
      lineNumbers: [],
    });
    const conditionNode1 = new Node("1", NodeType.NORMAL, "1", [], {
      lineNumbers: [],
    });
    const trueNode1 = new Node("2", NodeType.NORMAL, "2", [], {
      lineNumbers: [],
    });
    const falseNode1 = new Node("3", NodeType.NORMAL, "3", [], {
      lineNumbers: [],
    });
    const conditionNode2 = new Node("4", NodeType.NORMAL, "3", [], {
      lineNumbers: [],
    });
    const trueNode2 = new Node("5", NodeType.NORMAL, "5", [], {
      lineNumbers: [],
    });
    const falseNode2 = new Node("6", NodeType.NORMAL, "6", [], {
      lineNumbers: [],
    });
    const nodeExit = new Node("EXIT", NodeType.EXIT, "EXIT", [], {
      lineNumbers: [],
    });

    nodes.set(nodeEntry.id, nodeEntry);
    nodes.set(conditionNode1.id, conditionNode1);
    nodes.set(trueNode1.id, trueNode1);
    nodes.set(falseNode1.id, falseNode1);
    nodes.set(conditionNode2.id, conditionNode2);
    nodes.set(trueNode2.id, trueNode2);
    nodes.set(falseNode2.id, falseNode2);
    nodes.set(nodeExit.id, nodeExit);

    const edges = [
      new Edge("0", EdgeType.NORMAL, "0", nodeEntry.id, conditionNode1.id),
      new Edge(
        "1",
        EdgeType.CONDITIONAL_TRUE,
        "1",
        conditionNode1.id,
        trueNode1.id
      ),
      new Edge(
        "2",
        EdgeType.CONDITIONAL_FALSE,
        "2",
        conditionNode1.id,
        falseNode1.id
      ),
      new Edge("3", EdgeType.NORMAL, "3", trueNode1.id, conditionNode2.id),
      new Edge("4", EdgeType.NORMAL, "4", falseNode1.id, nodeExit.id),
      new Edge(
        "5",
        EdgeType.CONDITIONAL_TRUE,
        "5",
        conditionNode2.id,
        trueNode2.id
      ),
      new Edge(
        "6",
        EdgeType.CONDITIONAL_FALSE,
        "6",
        conditionNode2.id,
        falseNode2.id
      ),
      new Edge("7", EdgeType.NORMAL, "7", trueNode2.id, nodeExit.id),
      new Edge("8", EdgeType.NORMAL, "8", falseNode2.id, nodeExit.id),
    ];

    const cfg = new ControlFlowGraph(
      nodeEntry,
      nodeExit,
      nodeExit,
      nodes,
      edges
    );

    const cfp = contractControlFlowProgram({
      graph: cfg,
      functions: [
        {
          id: "test",
          name: "test",
          graph: cfg,
        },
      ],
    });

    const pathObjectives = extractPathObjectivesFromProgram(
      cfp,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator()
    );

    expect(pathObjectives.length).to.equal(3);
  });

  it("1 branch 1 loop", () => {
    const nodes: Map<string, Node> = new Map();

    const nodeEntry = new Node("ENTRY", NodeType.ENTRY, "ENTRY", [], {
      lineNumbers: [],
    });
    const loopNode1 = new Node("1", NodeType.NORMAL, "1", [], {
      lineNumbers: [],
    });
    const loopBody1 = new Node("2", NodeType.NORMAL, "2", [], {
      lineNumbers: [],
    });
    const conditionNode2 = new Node("4", NodeType.NORMAL, "3", [], {
      lineNumbers: [],
    });
    const trueNode2 = new Node("5", NodeType.NORMAL, "5", [], {
      lineNumbers: [],
    });
    const falseNode2 = new Node("6", NodeType.NORMAL, "6", [], {
      lineNumbers: [],
    });
    const loopExit1 = new Node("3", NodeType.NORMAL, "3", [], {
      lineNumbers: [],
    });
    const nodeExit = new Node("EXIT", NodeType.EXIT, "EXIT", [], {
      lineNumbers: [],
    });

    nodes.set(nodeEntry.id, nodeEntry);
    nodes.set(loopNode1.id, loopNode1);
    nodes.set(loopBody1.id, loopBody1);
    nodes.set(conditionNode2.id, conditionNode2);
    nodes.set(trueNode2.id, trueNode2);
    nodes.set(falseNode2.id, falseNode2);
    nodes.set(loopExit1.id, loopExit1);
    nodes.set(nodeExit.id, nodeExit);

    const edges = [
      new Edge("0", EdgeType.NORMAL, "0", nodeEntry.id, loopNode1.id),
      new Edge("1", EdgeType.CONDITIONAL_TRUE, "1", loopNode1.id, loopBody1.id),
      new Edge(
        "2",
        EdgeType.CONDITIONAL_FALSE,
        "2",
        loopNode1.id,
        loopExit1.id
      ),
      new Edge("3", EdgeType.NORMAL, "3", loopBody1.id, conditionNode2.id),
      new Edge(
        "4",
        EdgeType.CONDITIONAL_TRUE,
        "4",
        conditionNode2.id,
        trueNode2.id
      ),
      new Edge(
        "5",
        EdgeType.CONDITIONAL_FALSE,
        "5",
        conditionNode2.id,
        falseNode2.id
      ),
      new Edge("6", EdgeType.BACK_EDGE, "6", trueNode2.id, loopNode1.id),
      new Edge("7", EdgeType.BACK_EDGE, "7", falseNode2.id, loopNode1.id),

      new Edge("8", EdgeType.NORMAL, "8", loopExit1.id, nodeExit.id),
    ];

    const cfg = new ControlFlowGraph(
      nodeEntry,
      nodeExit,
      nodeExit,
      nodes,
      edges
    );

    const cfp = contractControlFlowProgram({
      graph: cfg,
      functions: [
        {
          id: "test",
          name: "test",
          graph: cfg,
        },
      ],
    });

    const pathObjectives = extractPathObjectivesFromProgram(
      cfp,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator()
    );

    expect(pathObjectives.length).to.equal(3);
  });
});
