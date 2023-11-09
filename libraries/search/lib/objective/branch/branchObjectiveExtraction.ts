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

import {
  ControlFlowFunction,
  ControlFlowProgram,
  Edge,
  EdgeType,
} from "@syntest/cfg";

import { Encoding } from "../../Encoding";
import { ApproachLevelCalculator } from "../heuristics/ApproachLevelCalculator";
import { BranchDistanceCalculator } from "../heuristics/BranchDistanceCalculator";

import { BranchObjectiveFunction } from "./BranchObjectiveFunction";

export function extractBranchObjectivesFromProgram<T extends Encoding>(
  cfp: ControlFlowProgram,
  approachLevelCalculator: ApproachLevelCalculator,
  branchDistanceCalculator: BranchDistanceCalculator
) {
  const objectives: BranchObjectiveFunction<T>[] = [];

  for (const cff of cfp.functions) {
    objectives.push(
      ...extractBranchObjectivesFromFunction(
        cff,
        cfp,
        approachLevelCalculator,
        branchDistanceCalculator
      )
    );
  }

  if (
    new Set(objectives.map((x) => x.getIdentifier())).size !== objectives.length
  ) {
    throw new Error("Duplicate objectives found!");
  }

  return objectives;
}

function extractBranchObjectivesFromFunction<T extends Encoding>(
  cff: ControlFlowFunction,
  cfp: ControlFlowProgram,
  approachLevelCalculator: ApproachLevelCalculator,
  branchDistanceCalculator: BranchDistanceCalculator
) {
  const objectives: Map<string, BranchObjectiveFunction<T>> = new Map();

  const graph = cff.graph;

  // queue of [parent objective, edge]
  const edgesQueue: [BranchObjectiveFunction<T>, Edge][] = graph
    .getOutgoingEdges(graph.entry.id)
    .map((edge): [BranchObjectiveFunction<T>, Edge] => [undefined, edge]); // should always be one

  const visitedEdges: Edge[] = [];

  while (edgesQueue.length > 0) {
    const [parentObjective, edge] = edgesQueue.pop();

    if (visitedEdges.includes(edge) || edge.type === EdgeType.BACK_EDGE) {
      // this condition is made to avoid infinite loops
      continue;
    }

    visitedEdges.push(edge);

    const outgoingEdges = graph.getOutgoingEdges(edge.target);

    if (outgoingEdges.length === 1) {
      // passthrough so we reuse the original parent objective
      edgesQueue.push([parentObjective, outgoingEdges[0]]);
    } else if (outgoingEdges.length >= 2) {
      // should always be 2 (e.g. not 3 or more)
      // control node
      for (const edge of outgoingEdges) {
        // get or create target
        const objective =
          objectives.get(edge.target) ??
          new BranchObjectiveFunction(
            edge.target,
            cfp,
            approachLevelCalculator,
            branchDistanceCalculator
          );

        objectives.set(edge.target, objective);

        if (parentObjective) {
          // connect to child
          parentObjective.addChildObjective(objective);
          // connect to parent
          objective.parentObjective = parentObjective;
        }

        edgesQueue.push([objective, edge]);
      }
    }
  }

  return [...objectives.values()];
}
