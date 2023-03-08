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

import { ControlFlowGraph } from "./ControlFlowGraph";
import { Node } from "./Node";
import { Edge } from "./Edge";
import { duplicateNodeInMappping, nodeNotFoundInMapping } from "../diagnostics";

/**
 * A contracted control flow graph.
 * This class contains the (original) full graph and a mapping between the nodes in the contracted graph and the nodes in the full graph.
 */
export class ContractedControlFlowGraph<S> extends ControlFlowGraph<S> {
  private readonly _fullGraph: ControlFlowGraph<S>;
  private readonly _nodeMapping: Map<string, string[]>;
  private readonly _reverseNodeMapping: Map<string, string>;

  constructor(
    entry: Node<S>,
    successExit: Node<S>,
    errorExit: Node<S>,
    nodes: Node<S>[],
    edges: Edge[],
    fullGraph: ControlFlowGraph<S>,
    nodeMapping: Map<string, string[]>
  ) {
    super(entry, successExit, errorExit, nodes, edges);
    this._fullGraph = fullGraph;
    this._nodeMapping = nodeMapping;
    this._reverseNodeMapping = new Map();

    for (const [key, value] of this._nodeMapping) {
      for (const node of value) {
        if (this._reverseNodeMapping.has(node))
          throw new Error(duplicateNodeInMappping());
        this._reverseNodeMapping.set(node, key);
      }
    }

    for (const node of nodes) {
      if (!this._nodeMapping.has(node.id)) {
        this._nodeMapping.set(node.id, [node.id]);
      }
      if (!this._reverseNodeMapping.has(node.id))
        this._reverseNodeMapping.set(node.id, node.id);
    }
  }

  get fullGraph(): ControlFlowGraph<S> {
    return this._fullGraph;
  }

  get nodeMapping(): Map<string, string[]> {
    return this._nodeMapping;
  }

  get reverseNodeMapping(): Map<string, string> {
    return this._reverseNodeMapping;
  }

  getParentNode(node: string): string {
    if (!this._reverseNodeMapping.has(node)) {
      throw new Error(nodeNotFoundInMapping(node));
    }
    return this._reverseNodeMapping.get(node);
  }

  getChildNodes(node: string): string[] {
    if (!this._nodeMapping.has(node)) {
      throw new Error(nodeNotFoundInMapping(node));
    }
    return this._nodeMapping.get(node);
  }
}
