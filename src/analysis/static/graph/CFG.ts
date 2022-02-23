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
}
