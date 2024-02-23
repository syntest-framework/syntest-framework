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
import { ControlFlowGraph, EdgeType, Node } from "@syntest/cfg";
import {
  failure,
  IllegalArgumentError,
  Result,
  success,
} from "@syntest/diagnostics";

import { Trace } from "../../Trace";

export type CalculationResult = {
  approachLevel: number;
  closestCoveredNode: Node;
  lastEdgeType: boolean;
  statementFraction: number;
};

export class ApproachLevelCalculator {
  calculate(
    cfg: ControlFlowGraph,
    node: Node,
    traces: Trace[],
  ): Result<CalculationResult> {
    // Construct map with key as id covered and value as datapoint that covers that id
    const idsTraceMap: Map<string, Trace> = new Map(
      traces
        .filter((trace) => trace.hits > 0)
        .map((trace) => [trace.id, trace]),
    );

    // Construct set of all covered ids
    const targets = new Set<string>(idsTraceMap.keys());

    return this._findClosestCoveredBranch(cfg, node.id, targets);
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  _findClosestCoveredBranch(
    cfg: ControlFlowGraph,
    nodeId: string,
    targets: Set<string>,
  ) {
    const visitedNodeIdSet = new Set<string>([nodeId]);
    const searchQueue: [string, number][] = [[nodeId, 0]];

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
          const sourceNode = cfg.getNodeById(edge.source);
          let statementCount = -1;
          for (let index = 0; index < sourceNode.statements.length; index++) {
            const statement = sourceNode.statements[index];
            if (targets.has(statement.id)) {
              statementCount = index + 1;
            }
          }

          return success({
            approachLevel: currentDistance,
            closestCoveredNode: cfg.getNodeById(edge.source),
            lastEdgeType: edge.type === EdgeType.CONDITIONAL_TRUE,
            statementFraction:
              sourceNode.statements.length === 0
                ? -1
                : statementCount / sourceNode.statements.length,
          });
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

    // if closest node is not found, we return the distance to the root branch
    return failure(
      new IllegalArgumentError("Cannot find the closest covered node"),
    );
  }
}
