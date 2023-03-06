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
import { Node } from "../graph/Node";
import { ControlFlowGraph } from "../graph/ControlFlowGraph";
import { Edge } from "../graph/Edge";
import { NodeType } from "../graph/NodeType";

/**
 * Edge contraction algorithm.
 *
 * This algorithm merges nodes with only one incoming and one outgoing edge.
 *
 * https://en.wikipedia.org/wiki/Control-flow_graph
 * @param controlFlowGraph the control flow graph to contract
 * @returns the contracted control flow graph
 */
export function edgeContraction(
  controlFlowGraph: ControlFlowGraph
): ControlFlowGraph {
  let changed = true;

  // Perform edge contraction until no more changes are made
  while (changed) {
    changed = false;

    if (controlFlowGraph.nodes.length === 2) {
      // Only entry and exit nodes left, so we can stop
      break;
    }

    /**
     * Perform BFS to find a node with only one incoming and one outgoing edge.
     */
    const queue: Edge[] = [];

    queue.push(...controlFlowGraph.entry.outgoingEdges);

    while (queue.length) {
      const edge = queue.shift();
      if (
        edge.source.outgoingEdges.length === 1 &&
        edge.target.incomingEdges.length === 1
      ) {
        controlFlowGraph = mergeNodes(
          controlFlowGraph,
          edge.source,
          edge.target
        );
        changed = true;
        break;
      }

      queue.push(...edge.target.outgoingEdges);
    }
  }

  return controlFlowGraph;
}

function mergeNodes(
  controlFlowGraph: ControlFlowGraph,
  node1: Node,
  node2: Node
): ControlFlowGraph {
  if (node1.outgoingEdges.length !== 1) {
    throw new Error("Node 1 has more than one outgoing edge");
  }

  if (node2.incomingEdges.length !== 1) {
    throw new Error("Node 2 has more than one incoming edge");
  }

  if (node1.outgoingEdges[0].target !== node2) {
    throw new Error("Node 1 and Node 2 are not directly connected");
  }

  const isEntry = node1 === controlFlowGraph.entry;
  const isSuccessExit = node2 === controlFlowGraph.successExit;
  const isErrorExit = node2 === controlFlowGraph.errorExit;

  if (isEntry && (isSuccessExit || isErrorExit)) {
    throw new Error("Cannot merge entry node with success or error exit node");
  }

  const newNode: Node = {
    id: node1.id + node2.id, // TODO we should have a special function for this maybe based on the statements
    type: isEntry
      ? NodeType.ENTRY
      : isSuccessExit
      ? NodeType.EXIT
      : isErrorExit
      ? NodeType.EXIT
      : NodeType.NORMAL,
    label: node1.label,

    incomingEdges: node1.incomingEdges,
    outgoingEdges: node2.outgoingEdges,
    statements: [...node1.statements, ...node2.statements],
  };

  const newNodes = controlFlowGraph.nodes
    .filter((node) => node !== node1 && node !== node2)
    .concat(newNode);
  const newEdges = controlFlowGraph.edges.filter(
    (edge) => edge.source !== node1 && edge.target !== node2
  );

  if (newNodes.length !== controlFlowGraph.nodes.length - 1) {
    throw new Error("Something went wrong while merging nodes");
  }

  if (newEdges.length !== controlFlowGraph.edges.length - 1) {
    throw new Error("Something went wrong while merging edges");
  }

  return {
    entry: isEntry ? newNode : controlFlowGraph.entry,
    successExit: isSuccessExit ? newNode : controlFlowGraph.successExit,
    errorExit: isErrorExit ? newNode : controlFlowGraph.errorExit,
    nodes: newNodes,
    edges: newEdges,
  };
}
