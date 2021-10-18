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
import { FunctionDescription } from "./parsing/FunctionDescription";
import { RootNode } from "./nodes/RootNode";
import { Visibility } from "./parsing/Visibility";

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

  get edges(): Edge[] {
    return this._edges;
  }

  set nodes(value: Node[]) {
    this._nodes = value;
  }

  set edges(value: Edge[]) {
    this._edges = value;
  }

  getFunctionDescriptions(contractOfInterest: string): FunctionDescription[] {
    let nodes = this.getRootNodes();
    nodes = this.filterRootNodes(nodes, contractOfInterest);
    return this.convertRootNodeToFunctionDescription(nodes);
  }

  getRootNodes(): RootNode[] {
    return this._nodes
      .filter((node) => node.type === NodeType.Root)
      .map((node) => <RootNode>node);
  }

  filterRootNodes(nodes: RootNode[], contractOfInterest: string): RootNode[] {
    return nodes.filter((node) => node.contractName === contractOfInterest);
  }

  visibilityToString(visibility: Visibility): string {
    return `${visibility}`;
  }

  convertRootNodeToFunctionDescription(
    nodes: RootNode[]
  ): FunctionDescription[] {
    // TODO bits and decimals?
    return nodes.map((node) => {
      return {
        name: node.functionName,
        isConstructor: node.isConstructor,
        type: node.isConstructor ? "constructor" : "function",
        visibility: node.visibility,
        parameters: node.parameters,
        returnParameters: node.returnParameters,
      };
    });
  }
}
