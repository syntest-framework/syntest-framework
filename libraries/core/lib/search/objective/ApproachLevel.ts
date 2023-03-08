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
import { Datapoint } from "../..";
import { ControlFlowGraph, Node } from "@syntest/cfg-core";

export class ApproachLevel {
  public static calculate<S>(
    cfg: ControlFlowGraph<S>,
    node: Node<S>,
    traces: Datapoint[]
  ): { approachLevel: number; closestCoveredBranchTrace: Datapoint } {
    // Construct map with key as line covered and value as datapoint that covers that line
    const linesTraceMap: Map<number, Datapoint> = traces
      .filter(
        (trace) =>
          (trace.type === "branch" ||
            trace.type === "probePre" ||
            trace.type === "probePost" ||
            trace.type === "function") &&
          trace.hits > 0
      )
      .reduce((map, trace) => {
        map.set(trace.line, trace);
        return map;
      }, new Map<number, Datapoint>());

    // Construct set of all covered lines
    const coveredLines = new Set<number>(linesTraceMap.keys());

    // Based on set of covered lines, filter CFG nodes that were covered and get their strings
    const coveredNodes = new Set<Node<S>>(
      cfg.filterNodesByLineNumbers(coveredLines)
    );

    const targetIds = new Set<string>([...coveredNodes].map((node) => node.id));

    const { approachLevel, closestCoveredBranch } =
      this._findClosestCoveredBranch(cfg, node.id, targetIds);

    // if closer node (branch or probe) is not found, we return the distance to the root branch
    if (!closestCoveredBranch) {
      return { approachLevel: null, closestCoveredBranchTrace: null };
    }

    // Retrieve trace based on lines covered by found closestCoveredBranch
    let closestCoveredBranchTrace: Datapoint = null;
    for (const line of closestCoveredBranch.metadata.lineNumbers) {
      if (linesTraceMap.has(line)) {
        closestCoveredBranchTrace = linesTraceMap.get(line);
        break;
      }
    }

    return { approachLevel, closestCoveredBranchTrace };
  }

  static _findClosestCoveredBranch<S>(
    cfg: ControlFlowGraph<S>,
    from: string,
    targets: Set<string>
  ): { approachLevel: number; closestCoveredBranch: Node<S> } {
    const visitedNodeIdSet = new Set<string>([from]);
    const searchQueue: [string, number][] = [[from, 0]];

    while (searchQueue.length !== 0) {
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
        if (cfg.getOutgoingEdges(edge.source).length > 1) {
          // If a node has more than one outgoing edge, it is a control node
          // Only control nodes are considered in the approach level
          searchQueue.push([edge.source, currentDistance + 1]);
        } else searchQueue.push([edge.source, currentDistance]);
      }
    }
    return {
      approachLevel: -1,
      closestCoveredBranch: null,
    };
  }
}
