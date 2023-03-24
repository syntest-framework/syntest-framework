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
  cannotMergeEntryAndExit,
  exactlyOneEdgeShouldBeRemoved,
  exactlyOneNodeShouldBeRemoved,
  notDirectlyConnected,
  tooManyIncoming,
  tooManyOutgoing,
} from "../diagnostics";
import { ContractedControlFlowGraph } from "../graph/ContractedControlFlowGraph";
import { ControlFlowGraph } from "../graph/ControlFlowGraph";
import { Edge } from "../graph/Edge";
import { Node } from "../graph/Node";
import { NodeType } from "../graph/NodeType";

/**
 * Edge contraction algorithm.
 *
 * This algorithm contracts every edge whose source has a single exit and whose destination has a single entry.
 *
 * https://en.wikipedia.org/wiki/Control-flow_graph
 * @param controlFlowGraph the control flow graph to contract
 * @returns the contracted control flow graph
 */
export function edgeContraction<S>(
  controlFlowGraph: ControlFlowGraph<S>
): ContractedControlFlowGraph<S> {
  const original = controlFlowGraph;
  const nodeMapping = new Map<string, string[]>();
  let changed = false;

  // Perform edge contraction until no more changes are made
  do {
    changed = false;

    if (controlFlowGraph.nodes.size === 2) {
      // Only entry and exit nodes left, so we can stop
      break;
    }

    /**
     * Perform BFS to find a node with only one incoming and one outgoing edge.
     */
    const queue: Edge[] = [];
    const visited: Set<string> = new Set();

    queue.push(...controlFlowGraph.getOutgoingEdges(controlFlowGraph.entry.id));

    while (queue.length > 0) {
      const edge = queue.shift();

      if (visited.has(edge.id)) {
        continue;
      }

      visited.add(edge.id);

      if (
        controlFlowGraph.getOutgoingEdges(edge.source).length === 1 &&
        controlFlowGraph.getIncomingEdges(edge.target).length === 1
      ) {
        controlFlowGraph = mergeNodes(
          controlFlowGraph,
          edge.source,
          edge.target
        );
        if (nodeMapping.has(edge.source)) {
          nodeMapping.get(edge.source).push(edge.target);
        } else {
          nodeMapping.set(edge.source, [edge.source, edge.target]);
        }

        changed = true;
        break;
      }

      queue.push(...controlFlowGraph.getOutgoingEdges(edge.target));
    }
  } while (changed);

  return new ContractedControlFlowGraph<S>(
    controlFlowGraph.entry,
    controlFlowGraph.successExit,
    controlFlowGraph.errorExit,
    controlFlowGraph.nodes,
    controlFlowGraph.edges,
    original,
    nodeMapping
  );
}

function mergeNodes<S>(
  controlFlowGraph: ControlFlowGraph<S>,
  node1: string,
  node2: string
): ControlFlowGraph<S> {
  if (controlFlowGraph.getOutgoingEdges(node1).length !== 1) {
    throw new Error(tooManyOutgoing(node1));
  }

  if (controlFlowGraph.getIncomingEdges(node2).length !== 1) {
    throw new Error(tooManyIncoming(node2));
  }

  if (controlFlowGraph.getOutgoingEdges(node1)[0].target !== node2) {
    throw new Error(notDirectlyConnected(node1, node2));
  }

  const isEntry = node1 === controlFlowGraph.entry.id;
  const isSuccessExit = node2 === controlFlowGraph.successExit.id;
  const isErrorExit = node2 === controlFlowGraph.errorExit.id;

  if (isEntry && (isSuccessExit || isErrorExit)) {
    throw new Error(cannotMergeEntryAndExit());
  }

  const node1Object = controlFlowGraph.getNodeById(node1);
  const node2Object = controlFlowGraph.getNodeById(node2);

  const newNode: Node<S> = new Node<S>(
    node1, // We use the id of node1 because the first node always contains the result of a control node (e.g. if, while, etc.) this is also where the instrumentation places the branch coverage
    isEntry
      ? NodeType.ENTRY
      : isSuccessExit
      ? NodeType.EXIT
      : isErrorExit
      ? NodeType.EXIT
      : NodeType.NORMAL,
    node1Object.label + "-" + node2Object.label,
    [...node1Object.statements, ...node2Object.statements],
    {
      ...node1Object.metadata,
      ...node2Object.metadata,
      lineNumbers: [
        ...node1Object.metadata.lineNumbers,
        ...node2Object.metadata.lineNumbers,
      ],
    }
  );

  const filteredNodes = [...controlFlowGraph.nodes.values()].filter(
    (node) => node.id !== node1 && node.id !== node2
  );

  const newNodesArray = [newNode, ...filteredNodes];

  const newNodes = new Map<string, Node<S>>(
    newNodesArray.map((node) => [node.id, node])
  );

  const removedEdges = controlFlowGraph.edges.filter(
    (edge) => edge.source === node1 && edge.target === node2
  );

  if (removedEdges.length !== 1) {
    throw new Error(
      exactlyOneEdgeShouldBeRemoved(node1, node2, removedEdges.length)
    );
  }

  const newEdges = controlFlowGraph.edges
    .filter((edge) => edge.id !== removedEdges[0].id)
    .map((edge) => {
      if (edge.source === node1) {
        // this case should not exist
        return new Edge(
          edge.id,
          edge.type,
          edge.label,
          newNode.id,
          edge.target,
          edge.description
        );
      }
      if (edge.target === node1) {
        return new Edge(
          edge.id,
          edge.type,
          edge.label,
          edge.source,
          newNode.id,
          edge.description
        );
      }
      if (edge.source === node2) {
        return new Edge(
          edge.id,
          edge.type,
          edge.label,
          newNode.id,
          edge.target,
          edge.description
        );
      }
      if (edge.target === node2) {
        // this case should not exist
        return new Edge(
          edge.id,
          edge.type,
          edge.label,
          edge.source,
          newNode.id,
          edge.description
        );
      }
      return edge;
    });

  if (newNodes.size !== controlFlowGraph.nodes.size - 1) {
    throw new Error(
      exactlyOneNodeShouldBeRemoved(
        node1,
        node2,
        newNodes.size - controlFlowGraph.nodes.size
      )
    );
  }

  if (newEdges.length !== controlFlowGraph.edges.length - 1) {
    throw new Error(
      exactlyOneEdgeShouldBeRemoved(
        node1,
        node2,
        newNodes.size - controlFlowGraph.nodes.size
      )
    );
  }

  return new ControlFlowGraph(
    isEntry ? newNode : controlFlowGraph.entry,
    isSuccessExit ? newNode : controlFlowGraph.successExit,
    isErrorExit ? newNode : controlFlowGraph.errorExit,
    newNodes,
    newEdges
  );
}
