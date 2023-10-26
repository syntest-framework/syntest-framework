/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { ControlFlowGraph, Edge, Node, NodeType } from "@syntest/cfg";

export function cfgToD3Graph(cfg: ControlFlowGraph, offset: number): D3Graph {
  let count = 0;

  const nodes = [...cfg.nodes.values()].map((n: Node) => {
    let name = `(${n.statements.map((s) => s.location.start.line).join(", ")})`;

    if (n.description && n.description.length > 0) {
      name = `(${n.statements.map((s) => s.location.start.line).join(", ")}: ${
        n.description
      })`;
    }
    name += `(${n.statements.map((s) => s.statementAsText).join("\n")})`;

    name = n.id;

    const node: D3Node = {
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
  });
  const links = cfg.edges.map((edge: Edge) => {
    return {
      id: edge.source + "-" + edge.target,
      source: edge.source,
      target: edge.target,
      type: edge.type,
    };
  });
  return {
    nodes: nodes,
    links: links,
  };
}

export interface D3Node extends d3.SimulationNodeDatum {
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
