import { Datapoint } from "../..";
import { ControlFlowGraph, Node } from "@syntest/cfg-core";
import { Pair } from "@syntest/cfg-core/dist/Pair";

export class ApproachLevel {
  public static calculate(
    cfg: ControlFlowGraph,
    node: Node,
    traces: Datapoint[]
  ): { approachLevel: number; hitTrace: Datapoint } {
    // Construct map with key as line covered and value as datapoint that coveres that line
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
    const coveredNodes = cfg.getNodesByLineNumbers(coveredLines);

    const targetIds = new Set<string>([...coveredNodes].map((node) => node.id));

    const { approachLevel, ancestor } = this._findClosestAncestor(
      cfg,
      node.id,
      targetIds
    );

    // if closer node (branch or probe) is not found, we return the distance to the root branch
    if (!ancestor) {
      return { approachLevel: null, hitTrace: null };
    }

    // Retrieve trace based on lines covered by found ancestor
    let hitTrace: Datapoint = null;
    for (const line of ancestor.lines) {
      if (linesTraceMap.has(line)) {
        hitTrace = linesTraceMap.get(line);
        break;
      }
    }

    return { approachLevel, hitTrace };
  }

  static _findClosestAncestor(
    cfg: ControlFlowGraph,
    from: string,
    targets: Set<string>
  ): { approachLevel: number; ancestor: Node } {
    const rotatedAdjList = cfg.getRotatedAdjacencyList();

    const visitedNodeIdSet = new Set<string>([from]);
    const searchQueue: Pair<number, string>[] = [{ first: 0, second: from }];

    let current = undefined;
    while (searchQueue.length != 0) {
      current = searchQueue.shift();
      const currentDistance: number = current.first;
      const currentNodeId: string = current.second;

      // get all neigbors of currently considered node
      const parentsOfCurrent = rotatedAdjList.get(currentNodeId);

      for (const pairOfParent of parentsOfCurrent) {
        const nextNodeId = pairOfParent.first;
        // ignore if already visited node
        if (visitedNodeIdSet.has(nextNodeId)) {
          continue;
        }
        // return if one of targets nodes was found
        if (targets.has(nextNodeId)) {
          return {
            approachLevel: currentDistance + pairOfParent.second,
            ancestor: cfg.getNodeById(nextNodeId),
          };
        }
        // add element to queue and visited nodes to continue search
        visitedNodeIdSet.add(nextNodeId);
        searchQueue.push({
          first: currentDistance + pairOfParent.second,
          second: nextNodeId,
        });
      }
    }
    return {
      approachLevel: -1,
      ancestor: null,
    };
  }
}
