/*
 * Copyright 2020-2023 SynTest contributors
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

import { ControlFlowFunction } from "../ControlFlowFunction";
import { ControlFlowPath } from "../ControlFlowPath";
import { ControlFlowProgram } from "../ControlFlowProgram";
import { EdgeType } from "../graph/EdgeType";

export function extractPathsFromProgram(cfp: ControlFlowProgram) {
  const paths: ControlFlowPath[] = [];
  for (const cff of cfp.functions) {
    paths.push(...extractPathsFromFunction(cff));
  }

  return paths;
}

export function extractPathsFromFunction(cff: ControlFlowFunction) {
  const paths: ControlFlowPath[] = [];

  const graph = cff.graph;
  const queue: ControlFlowPath[] = [
    new ControlFlowPath(undefined, [graph.entry.id]),
  ];
  while (queue.length > 0) {
    const current = queue.shift();
    const lastNodeId = current.last;
    const outgoingEdges = graph.getOutgoingEdges(lastNodeId);

    if (outgoingEdges.length === 0) {
      paths.push(current);
      continue;
    }

    for (const edge of outgoingEdges) {
      if (edge.type !== EdgeType.BACK_EDGE && current.contains(edge.target)) {
        // skip going into the same node twice (unless we are on a backedge)
        continue;
      }

      const clone = current.clone();
      clone.addNodeToPath(edge.target);

      if (edge.type === EdgeType.CONDITIONAL_TRUE) {
        clone.setControlNode(lastNodeId, true);
      } else if (edge.type === EdgeType.CONDITIONAL_FALSE) {
        clone.setControlNode(lastNodeId, false);
      }

      queue.push(clone);
    }
  }

  return paths;
}
