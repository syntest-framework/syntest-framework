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

import { ControlFlowProgram, Edge, EdgeType } from "@syntest/cfg";

import { Encoding } from "../../Encoding";
import { ApproachLevelCalculator } from "../heuristics/ApproachLevelCalculator";
import { BranchDistanceCalculator } from "../heuristics/BranchDistanceCalculator";
import { BranchObjectiveFunction } from "../objectiveFunctions/controlFlowBased/BranchObjectiveFunction";

// eslint-disable-next-line sonarjs/cognitive-complexity
export function extractBranchObjectivesFromProgram<T extends Encoding>(
  cfp: ControlFlowProgram,
  approachLevelCalculator: ApproachLevelCalculator,
  branchDistanceCalculator: BranchDistanceCalculator
) {
  const objectives: BranchObjectiveFunction<T>[] = [];

  for (const cff of cfp.functions) {
    const graph = cff.graph;

    // queue of [parent objective, edge]
    const edgesQueue: [BranchObjectiveFunction<T>, Edge][] = [];
    for (const edge of graph.getOutgoingEdges(graph.entry.id)) {
      edgesQueue.push([undefined, edge]);
    }

    const visitedEdges: Edge[] = [];

    while (edgesQueue.length > 0) {
      const [parentObjective, edge] = edgesQueue.pop();

      if (visitedEdges.includes(edge)) {
        // this condition is made to avoid infinite loops
        continue;
      }

      if (edge.type === EdgeType.BACK_EDGE) {
        continue;
      }

      visitedEdges.push(edge);

      const outgoingEdges = graph.getOutgoingEdges(edge.target);

      if (outgoingEdges.length === 0) {
        // no next
      } else if (outgoingEdges.length == 1) {
        // passthrough so we reuse the original parent objective
        edgesQueue.push([parentObjective, outgoingEdges[0]]);
      } else {
        // control node
        for (const edge of outgoingEdges) {
          const objective = new BranchObjectiveFunction(
            edge.target,
            cfp,
            approachLevelCalculator,
            branchDistanceCalculator
          );

          objectives.push(objective);

          if (parentObjective) {
            // connect to parent
            parentObjective.addChildObjective(objective);
          }

          edgesQueue.push([objective, edge]);
        }
      }
    }
  }

  return objectives;
}
