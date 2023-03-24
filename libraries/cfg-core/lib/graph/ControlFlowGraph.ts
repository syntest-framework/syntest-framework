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
import cloneDeep = require("lodash.clonedeep");

import { Edge } from "./Edge";
import { Node } from "./Node";
import { NodeType } from "./NodeType";

/**
 * Represents a control flow graph.
 */
export class ControlFlowGraph<S> {
  private readonly _entry: Node<S>;
  private readonly _successExit: Node<S>;
  private readonly _errorExit: Node<S>;
  private readonly _nodes: Map<string, Node<S>>;
  private readonly _edges: Edge[];

  private readonly _incomingEdges: Map<string, Edge[]>;
  private readonly _outgoingEdges: Map<string, Edge[]>;

  constructor(
    entry: Node<S>,
    successExit: Node<S>,
    errorExit: Node<S>,
    nodes: Map<string, Node<S>>,
    edges: Edge[]
  ) {
    this._entry = entry;
    this._successExit = successExit;
    this._errorExit = errorExit;
    this._nodes = cloneDeep(nodes);
    this._edges = cloneDeep(edges);

    this._incomingEdges = this.getIncomingEdgesMap();
    this._outgoingEdges = this.getOutgoingEdgesMap();
  }

  get entry(): Node<S> {
    return this._entry;
  }

  get successExit(): Node<S> {
    return this._successExit;
  }

  get errorExit(): Node<S> {
    return this._errorExit;
  }

  get nodes(): Map<string, Node<S>> {
    return this._nodes;
  }

  get edges(): Edge[] {
    return this._edges;
  }

  getIncomingEdges(nodeId: string): Edge[] {
    if (!this._incomingEdges.has(nodeId)) {
      return [];
    }
    return this._incomingEdges.get(nodeId);
  }

  getOutgoingEdges(nodeId: string): Edge[] {
    if (!this._outgoingEdges.has(nodeId)) {
      return [];
    }
    return this._outgoingEdges.get(nodeId);
  }

  /**
   * Builds the incoming edges map of the graph
   * @returns
   */
  private getIncomingEdgesMap(): Map<string, Edge[]> {
    const map = new Map<string, Edge[]>();
    for (const edge of this._edges) {
      if (!map.has(edge.target)) {
        map.set(edge.target, []);
      }
      map.get(edge.target).push(edge);
    }

    return map;
  }

  /**
   * Builds the outgoing edges map of the graph
   * @returns
   */
  private getOutgoingEdgesMap(): Map<string, Edge[]> {
    const map = new Map<string, Edge[]>();
    for (const edge of this._edges) {
      if (!map.has(edge.source)) {
        map.set(edge.source, []);
      }
      map.get(edge.source).push(edge);
    }
    return map;
  }

  /**
   * Reverses the edges of the graph
   * @returns
   */
  reverse(): ControlFlowGraph<S> {
    const reversedEdges = this._edges.map(
      (edge) =>
        new Edge(
          edge.id,
          edge.type,
          edge.label,
          edge.target,
          edge.source,
          `Reversed edge of ${edge.id}`
        )
    );

    return new ControlFlowGraph(
      this._successExit,
      this._entry,
      this._errorExit,
      this._nodes,
      reversedEdges
    );
  }

  // Successively applies a filter method on initial list of nodes with specified predicates
  getNodesByPredicates(...predicates: ((n: Node<S>) => boolean)[]) {
    let filteredList: Node<S>[] = [...this._nodes.values()];
    for (const predicate of predicates) {
      filteredList = filteredList.filter(predicate);
    }
    return filteredList;
  }

  // Applies a find method on list of nodes with a given predicate
  getNodeByPredicate(predicate: (n: Node<S>) => boolean) {
    return [...this._nodes.values()].find(predicate);
  }

  // Retrieves Node object based on its id
  getNodeById(nodeId: string): Node<S> {
    return this._nodes.get(nodeId);
  }

  getNodesByIds(nodeIds: string[]): Node<S>[] {
    return nodeIds.map((id) => this.getNodeById(id));
  }

  // Filters list of nodes, returning only nodes of a given type
  getNodesByType(type: NodeType): Node<S>[] {
    return [...this._nodes.values()].filter((n: Node<S>) => n.type === type);
  }

  // Filters list of nodes by specified line numbers,
  // returning only nodes that contain AT LEAST ONE OF the given line numbers
  getNodesByLineNumbers(lineNumbers: Set<number>): Node<S>[] {
    return [...this._nodes.values()].filter((node) =>
      node.metadata.lineNumbers.some((nodeLine) => lineNumbers.has(nodeLine))
    );
  }

  // Returns Node that contains specified line number and is of a given type
  getNodeOfTypeByLine(lineNumber: number, type: NodeType): Node<S> {
    return [...this._nodes.values()].find((n: Node<S>) => {
      return n.type === type && n.metadata.lineNumbers.includes(lineNumber);
    });
  }

  // Returns list of nodes that have an outgoing edge to the target node
  getParents(targetNodeId: string): Node<S>[] {
    const selectedIds = new Set<string>(
      this._edges
        .filter((edge: Edge) => edge.target === targetNodeId)
        .map((edge: Edge) => edge.source)
    );
    return [...this._nodes.values()].filter((node: Node<S>) =>
      selectedIds.has(node.id)
    );
  }

  // Returns list of nodes that have an outgoing edge from the target node
  getChildren(targetNodeId: string): Node<S>[] {
    const selectedIds = new Set<string>(
      this._edges
        .filter((edge: Edge) => edge.source === targetNodeId)
        .map((edge: Edge) => edge.target)
    );
    return [...this._nodes.values()].filter((node: Node<S>) =>
      selectedIds.has(node.id)
    );
  }
}
