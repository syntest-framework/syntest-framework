/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { Node, NodeType } from "./nodes/Node";
import { Edge } from "./Edge";
import { Pair } from "./util/Pair";
import { cloneDeep } from "lodash";

export class ControlFlowGraph {
  private readonly _nodes: Node[];
  private readonly _edges: Edge[];

  constructor(nodes: Node[], edges: Edge[]) {
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
      node.lines.some((nodeLine) => lineNumbers.has(nodeLine))
    );
  }

  // Returns Node that contains specified line number and is of a given type
  findNodeOfTypeByLine(lineNumber: number, type: NodeType): Node {
    return this._nodes.find((n: Node) => {
      return n.type === type && n.lines.includes(lineNumber);
    });
  }

  // Returns list of nodes that have an outgoing edge to the target node
  getParents(targetNodeId: string): Node[] {
    const selectedIds = new Set<string>(
      this._edges
        .filter((e: Edge) => e.to === targetNodeId)
        .map((e: Edge) => e.from)
    );
    return this._nodes.filter((node: Node) => selectedIds.has(node.id));
  }

  // Returns list of nodes that have an outgoing edge from the target node
  getChildren(targetNodeId: string): Node[] {
    const selectedIds = new Set<string>(
      this._edges
        .filter((e: Edge) => e.from === targetNodeId)
        .map((e: Edge) => e.to)
    );
    return this._nodes.filter((node: Node) => selectedIds.has(node.id));
  }

  /*
    Method return a map that has node ids as keys, and list of pairs as a value.
    Each of the pairs in the list of certain node represent a node of a parent as a first value, 
    and a number that indicates if the edge that connects this two nodes has a defined branch type i.e. weight of the edge
  */
  getRotatedAdjacencyList(): Map<string, Pair<string, number>[]> {
    const adjList = new Map<string, Pair<string, number>[]>();

    for (const edge of this._edges) {
      if (!adjList.has(edge.from)) {
        adjList.set(edge.from, []);
      }
      if (!adjList.has(edge.to)) {
        adjList.set(edge.to, []);
      }
      adjList.get(edge.to).push({
        first: edge.from,
        second: edge.branchType !== undefined ? 1 : 0,
      });
    }

    return adjList;
  }
}
