/*
 * Copyright 2020-2023 SynTest contributors
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
export class ControlFlowGraph {
  private readonly _entry: Node;
  private readonly _successExit: Node;
  private readonly _errorExit: Node;
  private readonly _nodes: Map<string, Node>;
  private readonly _edges: Edge[];

  private readonly _incomingEdges: Map<string, ReadonlyArray<Edge>>;
  private readonly _outgoingEdges: Map<string, ReadonlyArray<Edge>>;

  constructor(
    entry: Node,
    successExit: Node,
    errorExit: Node,
    nodes: Map<string, Node>,
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

  get entry(): Node {
    return this._entry;
  }

  get successExit(): Node {
    return this._successExit;
  }

  get errorExit(): Node {
    return this._errorExit;
  }

  get nodes(): Map<string, Node> {
    return this._nodes;
  }

  get edges(): Edge[] {
    return this._edges;
  }

  // Returns list of nodes that have an outgoing edge to the target node
  getParents(targetNodeId: string): Node[] {
    const parentEdges = this.getIncomingEdges(targetNodeId);
    return parentEdges.map((edge) => this.getNodeById(edge.source));
  }

  // Returns list of nodes that have an outgoing edge from the target node
  getChildren(targetNodeId: string): Node[] {
    const childEdges = this.getOutgoingEdges(targetNodeId);
    return childEdges.map((edge) => this.getNodeById(edge.target));
  }

  getIncomingEdges(nodeId: string): ReadonlyArray<Edge> {
    if (!this._incomingEdges.has(nodeId)) {
      return [];
    }
    return [...this._incomingEdges.get(nodeId)];
  }

  getOutgoingEdges(nodeId: string): ReadonlyArray<Edge> {
    if (!this._outgoingEdges.has(nodeId)) {
      return [];
    }
    return [...this._outgoingEdges.get(nodeId)];
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

  // Successively applies a filter method on initial list of nodes with specified predicates
  getNodesByPredicates(...predicates: ((n: Node) => boolean)[]) {
    let filteredList: Node[] = [...this._nodes.values()];
    for (const predicate of predicates) {
      filteredList = filteredList.filter((element) => predicate(element));
    }
    return filteredList;
  }

  // Applies a find method on list of nodes with a given predicate
  getNodeByPredicate(predicate: (n: Node) => boolean) {
    return [...this._nodes.values()].find((element) => predicate(element));
  }

  // Retrieves Node object based on its id
  getNodeById(nodeId: string): Node {
    return this._nodes.get(nodeId);
  }

  getNodesByIds(nodeIds: string[]): Node[] {
    return nodeIds.map((id) => this.getNodeById(id));
  }

  // Filters list of nodes, returning only nodes of a given type
  getNodesByType(type: NodeType): Node[] {
    return [...this._nodes.values()].filter((n: Node) => n.type === type);
  }

  // Filters list of nodes by specified line numbers,
  // returning only nodes that contain AT LEAST ONE OF the given line numbers
  getNodesByLineNumbers(lineNumbers: Set<number>): Node[] {
    return [...this._nodes.values()].filter((node) =>
      // maybe should check in between
      node.statements.some(
        (statement) =>
          lineNumbers.has(statement.location.start.line) ||
          lineNumbers.has(statement.location.end.line)
      )
    );
  }

  // Returns Node that contains specified line number and is of a given type
  getNodeOfTypeByLine(lineNumber: number, type: NodeType): Node {
    return [...this._nodes.values()].find((n: Node) => {
      // TODO maybe should check in between?
      return (
        n.type === type &&
        n.statements.some(
          (statement) =>
            statement.location.start.line === lineNumber ||
            statement.location.end.line === lineNumber
        )
      );
    });
  }
}
