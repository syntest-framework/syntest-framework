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
import { ControlFlowProgram } from "../ControlFlowProgram";
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

    bfs(
      controlFlowGraph,
      (edge: Edge) => {
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
      },
      (edge: Edge) => {
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
      }
    );
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

// side effects
export function contractControlFlowProgram<S>(program: ControlFlowProgram<S>) {
  program.graph = edgeContraction(program.graph);
  for (const f of program.functions) {
    f.graph = edgeContraction(f.graph);
  }

  return program;
}

function bfs<S>(
  controlFlowGraph: ControlFlowGraph<S>,
  condition: (edge: Edge) => boolean,
  callback: (edge: Edge) => void
) {
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

    if (condition(edge)) {
      callback(edge);
      break;
    }

    queue.push(...controlFlowGraph.getOutgoingEdges(edge.target));
  }
}

function beforeGuards<S>(
  controlFlowGraph: ControlFlowGraph<S>,
  source: string,
  target: string
) {
  if (controlFlowGraph.getOutgoingEdges(source).length !== 1) {
    throw new Error(tooManyOutgoing(source));
  }

  if (controlFlowGraph.getIncomingEdges(target).length !== 1) {
    throw new Error(tooManyIncoming(target));
  }

  if (controlFlowGraph.getOutgoingEdges(source)[0].target !== target) {
    throw new Error(notDirectlyConnected(source, target));
  }

  const isEntry = source === controlFlowGraph.entry.id;
  const isSuccessExit = target === controlFlowGraph.successExit.id;
  const isErrorExit = target === controlFlowGraph.errorExit.id;

  if (isEntry && (isSuccessExit || isErrorExit)) {
    throw new Error(cannotMergeEntryAndExit());
  }
}

function afterGuards<S>(
  newNodes: Map<string, Node<S>>,
  newEdges: Edge[],
  controlFlowGraph: ControlFlowGraph<S>,
  source: string,
  target: string
) {
  if (newNodes.size !== controlFlowGraph.nodes.size - 1) {
    throw new Error(
      exactlyOneNodeShouldBeRemoved(
        source,
        target,
        newNodes.size - controlFlowGraph.nodes.size
      )
    );
  }

  if (newEdges.length !== controlFlowGraph.edges.length - 1) {
    throw new Error(
      exactlyOneEdgeShouldBeRemoved(
        source,
        target,
        newNodes.size - controlFlowGraph.nodes.size
      )
    );
  }
}

function mergeNodes<S>(
  controlFlowGraph: ControlFlowGraph<S>,
  source: string,
  target: string
): ControlFlowGraph<S> {
  beforeGuards(controlFlowGraph, source, target);

  const sourceNode = controlFlowGraph.getNodeById(source);
  const targetNode = controlFlowGraph.getNodeById(target);

  const mergedNode: Node<S> = new Node<S>(
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

  const newNodes = new Map<string, Node<S>>(
    newNodesArray.map((node) => [node.id, node])
  );

  const removedEdges = controlFlowGraph.edges.filter(
    (edge) => edge.source === source && edge.target === target
  );

  if (removedEdges.length !== 1) {
    throw new Error(
      exactlyOneEdgeShouldBeRemoved(source, target, removedEdges.length)
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

  return new ControlFlowGraph(
    controlFlowGraph.entry,
    controlFlowGraph.successExit,
    controlFlowGraph.errorExit,
    newNodes,
    newEdges
  );
}
