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
  failure,
  IllegalStateError,
  isFailure,
  Result,
  success,
  unwrap,
} from "@syntest/diagnostics";

import { ControlFlowProgram } from "../ControlFlowProgram";
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
export function edgeContraction(
  controlFlowGraph: ControlFlowGraph
): Result<ContractedControlFlowGraph> {
  const original = controlFlowGraph;
  const nodeMapping = new Map<string, string[]>();

  // Perform edge contraction until no more changes are made
  do {
    if (controlFlowGraph.nodes.size === 2) {
      // Only entry and exit nodes left, so we can stop
      break;
    }

    const edge = bfs(controlFlowGraph, (edge: Edge) => {
      return (
        controlFlowGraph.getOutgoingEdges(edge.source).length === 1 &&
        controlFlowGraph.getIncomingEdges(edge.target).length === 1 &&
        edge.source !== controlFlowGraph.entry.id &&
        edge.source !== controlFlowGraph.successExit.id &&
        edge.source !== controlFlowGraph.errorExit.id &&
        edge.target !== controlFlowGraph.entry.id &&
        edge.target !== controlFlowGraph.successExit.id &&
        edge.target !== controlFlowGraph.errorExit.id
      );
    });

    if (edge === undefined) {
      // done
      break;
    }

    const result = mergeNodes(controlFlowGraph, edge.source, edge.target);

    if (isFailure(result)) return result;

    controlFlowGraph = unwrap(result);

    if (nodeMapping.has(edge.source)) {
      nodeMapping.get(edge.source).push(edge.target);
    } else {
      nodeMapping.set(edge.source, [edge.source, edge.target]);
    }
    // eslint-disable-next-line no-constant-condition
  } while (true);

  // safety check
  for (const edge of controlFlowGraph.edges) {
    const outgoingFromSource = controlFlowGraph.getOutgoingEdges(edge.source);
    const incomingToTarget = controlFlowGraph.getIncomingEdges(edge.target);

    if (outgoingFromSource.length > 1 && incomingToTarget.length > 1) {
      return failure(
        new IllegalStateError("Missing placeholder node between 2 nodes", {
          context: { node1: edge.source, node2: edge.target },
        })
      );
    }
  }

  return success(
    new ContractedControlFlowGraph(
      controlFlowGraph.entry,
      controlFlowGraph.successExit,
      controlFlowGraph.errorExit,
      controlFlowGraph.nodes,
      controlFlowGraph.edges,
      original,
      nodeMapping
    )
  );
}

// side effects
export function contractControlFlowProgram(
  program: ControlFlowProgram
): Result<ControlFlowProgram> {
  const result = edgeContraction(program.graph);

  if (isFailure(result)) return result;

  program.graph = unwrap(result);
  for (const f of program.functions) {
    const result = edgeContraction(f.graph);

    if (isFailure(result)) return result;

    f.graph = unwrap(result);
  }

  return success(program);
}

/**
 * BFS to find an edge in the graph that matches the provided condition
 * @param controlFlowGraph the graph to search in
 * @param condition the condition to match
 * @returns the matching edge
 */
function bfs(
  controlFlowGraph: ControlFlowGraph,
  condition: (edge: Edge) => boolean
): Edge | undefined {
  const queue: Edge[] = [];
  const visited: Set<string> = new Set();

  queue.push(...controlFlowGraph.getOutgoingEdges(controlFlowGraph.entry.id));

  while (queue.length > 0) {
    const edge = queue.shift();

    if (visited.has(edge.id)) {
      continue;
    }

    visited.add(edge.id);

    if (condition(edge)) {
      return edge;
    }

    queue.push(...controlFlowGraph.getOutgoingEdges(edge.target));
  }

  return undefined;
}

function beforeGuards(
  controlFlowGraph: ControlFlowGraph,
  source: string,
  target: string
): void {
  if (controlFlowGraph.getOutgoingEdges(source).length !== 1) {
    throw new IllegalStateError(
      "Cannot merge nodes, node has more than one outgoing edge",
      { context: { node: source } }
    );
  }

  if (controlFlowGraph.getIncomingEdges(target).length !== 1) {
    throw new IllegalStateError(
      "Cannot merge nodes, node has more than one incoming edge",
      { context: { node: target } }
    );
  }

  if (controlFlowGraph.getOutgoingEdges(source)[0].target !== target) {
    throw new IllegalStateError(
      "Cannot merge nodes, nodes are not directly connected",
      { context: { node1: source, node2: target } }
    );
  }

  const isEntry = source === controlFlowGraph.entry.id;
  const isSuccessExit = target === controlFlowGraph.successExit.id;
  const isErrorExit = target === controlFlowGraph.errorExit.id;

  if (isEntry && (isSuccessExit || isErrorExit)) {
    throw new IllegalStateError("Cannot merge entry and exit nodes");
  }
}

function afterGuards(
  newNodes: Map<string, Node>,
  newEdges: Edge[],
  controlFlowGraph: ControlFlowGraph,
  source: string,
  target: string
): void {
  if (newNodes.size !== controlFlowGraph.nodes.size - 1) {
    throw new IllegalStateError(
      "Exactly one node should be removed when merging nodes",
      {
        context: {
          mergeNode1: source,
          mergeNode2: target,
          removedAmount: newNodes.size - controlFlowGraph.nodes.size,
        },
      }
    );
  }

  if (newEdges.length !== controlFlowGraph.edges.length - 1) {
    throw new IllegalStateError(
      "Exactly one edge should be removed when merging nodes",
      {
        context: {
          mergeNode1: source,
          mergeNode2: target,
          removedAmount: newEdges.length - controlFlowGraph.edges.length,
        },
      }
    );
  }
}

function mergeNodes(
  controlFlowGraph: ControlFlowGraph,
  source: string,
  target: string
): Result<ControlFlowGraph> {
  beforeGuards(controlFlowGraph, source, target);

  const sourceNode = controlFlowGraph.getNodeById(source);
  const targetNode = controlFlowGraph.getNodeById(target);

  const mergedNode: Node = new Node(
    source, // We use the id of node1 because the first node always contains the result of a control node (e.g. if, while, etc.) this is also where the instrumentation places the branch coverage
    NodeType.NORMAL,
    sourceNode.label + "-" + targetNode.label,
    [...sourceNode.statements, ...targetNode.statements],
    {
      ...sourceNode.metadata,
      ...targetNode.metadata,
    }
  );

  const filteredNodes = [...controlFlowGraph.nodes.values()].filter(
    (node) => node.id !== source && node.id !== target
  );

  const newNodesArray = [mergedNode, ...filteredNodes];

  const newNodes = new Map<string, Node>(
    newNodesArray.map((node) => [node.id, node])
  );

  const removedEdges = controlFlowGraph.edges.filter(
    (edge) => edge.source === source && edge.target === target
  );

  if (removedEdges.length !== 1) {
    return failure(
      new IllegalStateError(
        "Exactly one edge should be removed when merging nodes",
        {
          context: {
            mergeNode1: source,
            mergeNode2: target,
            removedAmount: removedEdges.length,
          },
        }
      )
    );
  }

  const newEdges = controlFlowGraph.edges
    .filter((edge) => edge.id !== removedEdges[0].id)
    .map((edge) => {
      if (edge.source === target || edge.source === source) {
        // second case should not exist as there is only one outgoing edge
        return new Edge(
          edge.id,
          edge.type,
          edge.label,
          mergedNode.id,
          edge.target,
          edge.description
        );
      }

      if (edge.target === source || edge.target === target) {
        // second case should not exist as there is only one incoming edge
        return new Edge(
          edge.id,
          edge.type,
          edge.label,
          edge.source,
          mergedNode.id,
          edge.description
        );
      }
      return edge;
    });

  afterGuards(newNodes, newEdges, controlFlowGraph, source, target);

  return success(
    new ControlFlowGraph(
      controlFlowGraph.entry,
      controlFlowGraph.successExit,
      controlFlowGraph.errorExit,
      newNodes,
      newEdges
    )
  );
}
