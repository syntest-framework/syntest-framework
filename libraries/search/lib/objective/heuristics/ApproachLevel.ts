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
import { ControlFlowGraph, EdgeType, Node } from "@syntest/cfg";

import { Datapoint } from "../../util/Datapoint";
import { cannotFindTraceThatIsCovered } from "../../util/diagnostics";

export class ApproachLevel {
  public calculate(
    cfg: ControlFlowGraph,
    node: Node,
    traces: Datapoint[]
  ): {
    approachLevel: number;
    closestCoveredNode: Node;
    closestCoveredBranchTrace: Datapoint;
  } {
    // Construct map with key as id covered and value as datapoint that covers that id
    const idsTraceMap: Map<string, Datapoint> = new Map(
      traces.filter((trace) => trace.hits > 0).map((trace) => [trace.id, trace])
    );

    // Construct set of all covered ids
    const coveredNodeIds = new Set<string>(idsTraceMap.keys());

    const { approachLevel, closestCoveredBranch } =
      this._findClosestCoveredBranch(cfg, node.id, coveredNodeIds);

    // if closest node is not found, we return the distance to the root branch
    if (!closestCoveredBranch) {
      return {
        approachLevel: undefined,
        closestCoveredNode: undefined,
        closestCoveredBranchTrace: undefined,
      };
    }

    // Retrieve trace based on ids covered by found closestCoveredBranch
    const closestCoveredBranchTrace = idsTraceMap.get(closestCoveredBranch.id);

    if (!closestCoveredBranchTrace) {
      throw new Error(cannotFindTraceThatIsCovered());
    }

    return {
      approachLevel,
      closestCoveredNode: closestCoveredBranch,
      closestCoveredBranchTrace,
    };
  }

  _findClosestCoveredBranch(
    cfg: ControlFlowGraph,
    from: string,
    targets: Set<string>
  ): { approachLevel: number; closestCoveredBranch: Node } {
    const visitedNodeIdSet = new Set<string>([from]);
    const searchQueue: [string, number][] = [[from, 0]];

    while (searchQueue.length > 0) {
      const current = searchQueue.shift();
      const currentNodeId: string = current[0];
      const currentDistance: number = current[1];

      // get all neighbors of currently considered node
      const incomingEdges = cfg.getIncomingEdges(currentNodeId);

      for (const edge of incomingEdges) {
        // ignore if already visited node
        if (visitedNodeIdSet.has(edge.source)) {
          continue;
        }

        // return if one of targets nodes was found
        if (targets.has(edge.source)) {
          return {
            approachLevel: currentDistance,
            closestCoveredBranch: cfg.getNodeById(edge.source),
          };
        }

        // add element to queue and visited nodes to continue search
        visitedNodeIdSet.add(edge.source);
        if (
          edge.type === EdgeType.CONDITIONAL_TRUE ||
          edge.type === EdgeType.CONDITIONAL_FALSE
        ) {
          // If a node has more than one outgoing edge, it is a control node
          // Only control nodes are considered in the approach level
          searchQueue.push([edge.source, currentDistance + 1]);
        } else {
          searchQueue.push([edge.source, currentDistance]);
        }
      }
    }
    return {
      approachLevel: -1,
      closestCoveredBranch: undefined,
    };
  }
}
