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
import { Node } from "./Node";
import { Edge } from "./Edge";
import { NodeType } from "./NodeType";
import cloneDeep = require("lodash.clonedeep");

/**
 * Represents a control flow graph.
 */
export class ControlFlowGraph {
  private readonly entry: Node;
  private readonly successExit: Node;
  private readonly errorExit: Node;
  private readonly _nodes: Node[];
  private readonly _edges: Edge[];

  constructor(
    entry: Node,
    successExit: Node,
    errorExit: Node,
    nodes: Node[],
    edges: Edge[]
  ) {
    this.entry = entry;
    this.successExit = successExit;
    this.errorExit = errorExit;
    this._nodes = cloneDeep(nodes);
    this._edges = cloneDeep(edges);
  }

  get nodes(): Node[] {
    return this._nodes;
  }

  get edges(): Edge[] {
    return this._edges;
  }

  // Successively applies a filter method on initial list of nodes with specified predicates
  filterNodesByPredicates(...predicates: ((n: Node) => boolean)[]) {
    let filteredList: Node[] = this._nodes;
    for (const predicate of predicates) {
      filteredList = filteredList.filter(predicate);
    }
    return filteredList;
  }

  // Applies a find method on list of nodes with a given predicate
  findNodeByPredicate(predicate: (n: Node) => boolean) {
    return this._nodes.find(predicate);
  }

  // Retrieves Node object based on its id
  getNodeById(nodeId: string): Node {
    const node = this._nodes.find((node: Node) => node.id === nodeId);
    return node;
  }

  // Filters list of nodes, returning only nodes of a given type
  filterNodesOfType(type: NodeType): Node[] {
    return this._nodes.filter((n: Node) => n.type === type);
  }

  // Filters list of nodes by specified line numbers,
  // returning only nodes that contain AT LEAST ONE OF the given line numbers
  filterNodesByLineNumbers(lineNumbers: Set<number>): Node[] {
    return this._nodes.filter((node) =>
      node.metadata.lineNumbers.some((nodeLine) => lineNumbers.has(nodeLine))
    );
  }

  // Returns Node that contains specified line number and is of a given type
  findNodeOfTypeByLine(lineNumber: number, type: NodeType): Node {
    return this._nodes.find((n: Node) => {
      return n.type === type && n.metadata.lineNumbers.includes(lineNumber);
    });
  }

  // Returns list of nodes that have an outgoing edge to the target node
  getParents(targetNodeId: string): Node[] {
    const selectedIds = new Set<string>(
      this._edges
        .filter((e: Edge) => e.target.id === targetNodeId)
        .map((e: Edge) => e.source.id)
    );
    return this._nodes.filter((node: Node) => selectedIds.has(node.id));
  }

  // Returns list of nodes that have an outgoing edge from the target node
  getChildren(targetNodeId: string): Node[] {
    const selectedIds = new Set<string>(
      this._edges
        .filter((e: Edge) => e.source.id === targetNodeId)
        .map((e: Edge) => e.target.id)
    );
    return this._nodes.filter((node: Node) => selectedIds.has(node.id));
  }

  /*
        Method return a map that has node ids as keys, and list of pairs as a value.
        Each of the pairs in the list of certain node represent a node of a parent as a first value, 
        and a number that indicates if the edge that connects this two nodes has a defined branch type i.e. weight of the edge
    */
  getRotatedAdjacencyList(): Map<string, string[]> {
    const adjList = new Map<string, string[]>();

    for (const edge of this._edges) {
      if (!adjList.has(edge.source.id)) {
        adjList.set(edge.source.id, []);
      }
      if (!adjList.has(edge.target.id)) {
        adjList.set(edge.target.id, []);
      }
      adjList.get(edge.target.id).push(edge.source.id);
    }

    return adjList;
  }
}
