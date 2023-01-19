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

  getNodeById(nodeId : string): Node {
    const found = this._nodes.filter((node: Node) => node.id == nodeId);
    if(found.length != 1) {
      console.log("No node with such id in CFG");
      return null;
    }
    return found[0];
  }

  findClosestAncestor(from: string, targets: string[]): [number, Node] {
    let targetsSet = new Set<string>(targets);

    let visitedNodeIdSet = new Set<string>([from]);
    const searchQueue = [];
    searchQueue.push([0, from]);
    
    let current = undefined;
    while(searchQueue.length != 0) {
      current = searchQueue.shift();
      let currentDistance: number = current[0];
      let currentNodeId: string = current[1];

      console.log(currentNodeId);
      // get all neigbors of currently considered node
      console.log(this._edges);
      let edgesToNeighbors: Edge[] = this._edges.filter((e: Edge) => e.to === currentNodeId);
      console.log(edgesToNeighbors);
      
      for(const edge of edgesToNeighbors) {
        let nextNodeId = edge.from;
        // ignore if already visited node
        if(visitedNodeIdSet.has(nextNodeId)) {
          continue;
        }
        // return if of targets nodes was found
        if(targetsSet.has(nextNodeId)) {
          return [currentDistance + (edge.branchType !== undefined ? 1 : 0), this.getNodeById(nextNodeId)];
        }
        // add element to queue and visited nodes to continue search
        visitedNodeIdSet.add(nextNodeId);
        searchQueue.push([currentDistance + (edge.branchType !== undefined ? 1 : 0), nextNodeId]);
      }
    }
    console.log("No covered nodes found");
    return [-1, undefined];
  }
}
