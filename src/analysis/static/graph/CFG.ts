/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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
import { Pair } from "./Pair";
import { RootNode } from "./nodes/RootNode";

export class CFG {
  private _nodes: Node[];
  private _edges: Edge[];

  constructor() {
    this._nodes = [];
    this._edges = [];
  }

  get nodes(): Node[] {
    return this._nodes;
  }

  set nodes(value: Node[]) {
    this._nodes = value;
  }

  get edges(): Edge[] {
    return this._edges;
  }

  set edges(value: Edge[]) {
    this._edges = value;
  }

  getRootNodes(): RootNode[] {
    return this._nodes
      .filter((node) => node.type === NodeType.Root)
      .map((node) => <RootNode>node);
  }

  getNodeById(nodeId: string): Node {
    const node = this._nodes.find((node: Node) => node.id == nodeId);
    return node;
  }

  /*
    Method return a map that has node ids as keys, and list of pairs as a value.
    Each of the pairs in the list of certain node represent a node of a parent as a first value, 
    and a number that indicates if the edge that connects this two nodes has a defined branch type i.e. weight of the edge
  */
  getRotatedAdjacencyList(): Map<String, Pair<string, number>[]> {
    let adjList = new Map<String, Pair<string, number>[]>();

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

  findClosestAncestor(
    from: string,
    targets: Set<string>
  ): { distance: number; ancestor: Node } {
    const rotatedAdjList = this.getRotatedAdjacencyList();

    let visitedNodeIdSet = new Set<string>([from]);
    const searchQueue: Pair<number, string>[] = [{ first: 0, second: from }];

    let current = undefined;
    while (searchQueue.length != 0) {
      current = searchQueue.shift();
      let currentDistance: number = current.first;
      let currentNodeId: string = current.second;

      // get all neigbors of currently considered node
      let parentsOfCurrent = rotatedAdjList.get(currentNodeId);

      for (const pairOfParent of parentsOfCurrent) {
        let nextNodeId = pairOfParent.first;
        // ignore if already visited node
        if (visitedNodeIdSet.has(nextNodeId)) {
          continue;
        }
        // return if one of targets nodes was found
        if (targets.has(nextNodeId)) {
          return {
            distance: currentDistance + pairOfParent.second,
            ancestor: this.getNodeById(nextNodeId),
          };
        }
        // add element to queue and visited nodes to continue search
        visitedNodeIdSet.add(nextNodeId);
        searchQueue.push({
          first: currentDistance + pairOfParent.second,
          second: nextNodeId,
        });
      }
    }
    return {
      distance: -1,
      ancestor: null,
    };
  }
}
