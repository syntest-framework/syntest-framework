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

import {
  BranchNode,
  ControlFlowGraph,
  Edge,
  Node,
  NodeType,
} from "@syntest/cfg-core";

export function cfgToD3Graph(cfg: ControlFlowGraph, offset: number): D3Graph {
  let count = 0;

  const nodes = [
    ...cfg.nodes.map((n: Node) => {
      let name = `(${n.lines[0]})`;

      if (n.description && n.description.length) {
        name = `(${n.lines[0]}: ${n.description})`;
      }

      if (n.type === NodeType.Branch) {
        name += ` ${(<BranchNode>n).condition.operator}`;
      }

      const node = {
        id: n.id,
        name: name,
        fixed: n.type === NodeType.Root,
        root: n.type === NodeType.Root,
        fx: undefined,
        fy: undefined,
      };

      if (node.root) {
        node.fx = 50 + (count + 1) * offset;
        node.fy = 20;
        count += 1;
      }

      return node;
    }),
  ];

  const links = [
    ...cfg.edges.map((e: Edge) => {
      return {
        id: e.from + "-" + e.to,
        source: e.from,
        target: e.to,
        type: e.branchType,
      };
    }),
  ];

  return {
    nodes: nodes,
    links: links,
  };
}

export interface D3Node {
  id: string;
  name: string;
  fixed: boolean;
  root: boolean;
  fx: number;
  fy: number;
}
export interface D3Link {
  id: string;
  source: string;
  target: string;
  type: boolean;
}

export interface D3Graph {
  nodes: D3Node[];
  links: D3Link[];
}
