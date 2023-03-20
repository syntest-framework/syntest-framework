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

import { ControlFlowGraph, Node, Edge, NodeType } from "@syntest/cfg-core";

export function cfgToD3Graph<S>(
  cfg: ControlFlowGraph<S>,
  offset: number
): D3Graph {
  let count = 0;

  const nodes = [
    ...[...cfg.nodes.values()].map((n: Node<S>) => {
      let name = `(${n.metadata.lineNumbers.join(", ")})`;

      if (n.description && n.description.length) {
        name = `(${n.metadata.lineNumbers.join(", ")}: ${n.description})`;
      }
      name += `\n${n.label}`;
      name += `\n${n.statements.map((s) => `${s}`).join("\n")}`;

      const node = {
        id: n.id,
        name: name,
        fixed: n.type === NodeType.ENTRY,
        root: n.type === NodeType.ENTRY,
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
        id: e.source + "-" + e.target,
        source: e.source,
        target: e.target,
        type: e.type,
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
  type: string;
}

export interface D3Graph {
  nodes: D3Node[];
  links: D3Link[];
}
