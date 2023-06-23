/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
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
import { RootContext, SubTarget, Target } from "@syntest/analysis-javascript";
import { TargetType } from "@syntest/analysis";
import { ControlFlowGraph, Edge, EdgeType } from "@syntest/cfg";
import {
  FunctionObjectiveFunction,
  ObjectiveFunction,
  SearchSubject,
  ApproachLevel,
  shouldNeverHappen,
  BranchObjectiveFunction,
} from "@syntest/search";

import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import { BranchDistance } from "../criterion/BranchDistance";

export class JavaScriptSubject extends SearchSubject<JavaScriptTestCase> {
  protected stringAlphabet: string;
  constructor(
    target: Target,
    rootContext: RootContext,
    stringAlphabet: string
  ) {
    super(target, rootContext);
    this.stringAlphabet = stringAlphabet;

    this._extractObjectives();
  }

  protected _extractObjectives(): void {
    this._objectives = new Map<
      ObjectiveFunction<JavaScriptTestCase>,
      ObjectiveFunction<JavaScriptTestCase>[]
    >();

    const functions = this._rootContext.getControlFlowProgram(
      this._target.path
    ).functions;

    // FUNCTION objectives
    for (const function_ of functions) {
      const graph = function_.graph;
      // Branch objectives
      // Find all control nodes
      // I.E. nodes that have more than one outgoing edge
      const controlNodeIds = [...graph.nodes.keys()].filter(
        (node) => graph.getOutgoingEdges(node).length > 1
      );

      for (const controlNodeId of controlNodeIds) {
        const outGoingEdges = graph.getOutgoingEdges(controlNodeId);

        for (const edge of outGoingEdges) {
          if (["ENTRY", "SUCCESS_EXIT", "ERROR_EXIT"].includes(edge.target)) {
            throw new Error(
              `Function ${function_.name} in ${function_.id} ends in entry/exit node`
            );
          }
          // Add objective function
          this._objectives.set(
            new BranchObjectiveFunction(
              new ApproachLevel(),
              new BranchDistance(this.stringAlphabet),
              this,
              edge.target
            ),
            []
          );
        }
      }

      for (const objective of this._objectives.keys()) {
        const childrenObject = this.findChildren(graph, objective);
        this._objectives.get(objective).push(...childrenObject);
      }

      const entry = function_.graph.entry;

      const children = function_.graph.getChildren(entry.id);

      if (children.length !== 1) {
        throw new Error(shouldNeverHappen("JavaScriptSubject")); //, "entry node has more than one child"))
      }

      // Add objective
      const functionObjective = new FunctionObjectiveFunction(
        this,
        function_.id
      );

      // find first control node in function
      let firstControlNodeInFunction = children[0];
      while (
        function_.graph.getChildren(firstControlNodeInFunction.id).length === 1
      ) {
        firstControlNodeInFunction = function_.graph.getChildren(
          firstControlNodeInFunction.id
        )[0];
      }

      // there are control nodes in the function
      if (
        function_.graph.getChildren(firstControlNodeInFunction.id).length === 2
      ) {
        const firstObjectives = function_.graph
          .getChildren(firstControlNodeInFunction.id)
          .map((child) => {
            return [...this._objectives.keys()].find(
              (objective) => objective.getIdentifier() === child.id
            );
          });

        if (!firstObjectives[0] || !firstObjectives[1]) {
          throw new Error(
            `Cannot find objective with id: ${firstControlNodeInFunction.id}`
          );
        }

        this._objectives.set(functionObjective, [...firstObjectives]);
      } else {
        // no control nodes so no sub objectives
        this._objectives.set(functionObjective, []);
      }
    }
  }

  findChildren(
    graph: ControlFlowGraph,
    object: ObjectiveFunction<JavaScriptTestCase>
  ): ObjectiveFunction<JavaScriptTestCase>[] {
    let childObjectives: ObjectiveFunction<JavaScriptTestCase>[] = [];

    let edges2Visit = [...graph.getOutgoingEdges(object.getIdentifier())];

    const visitedEdges: Edge[] = [];

    while (edges2Visit.length > 0) {
      const edge = edges2Visit.pop();

      if (visitedEdges.includes(edge)) {
        // this condition is made to avoid infinite loops
        continue;
      }

      if (edge.type === EdgeType.BACK_EDGE) {
        continue;
      }

      visitedEdges.push(edge);

      const found = this.getObjectives().filter(
        (child) => child.getIdentifier() === edge.target
      );
      if (found.length === 0) {
        const additionalEdges = graph.getOutgoingEdges(edge.target);
        edges2Visit = [...edges2Visit, ...additionalEdges];
      } else {
        childObjectives = [...childObjectives, ...found];
      }
    }

    return childObjectives;
  }

  getActionableTargets(): SubTarget[] {
    return this._target.subTargets.filter((t) => {
      return (
        t.type === TargetType.FUNCTION ||
        t.type === TargetType.CLASS ||
        t.type === TargetType.METHOD ||
        t.type === TargetType.OBJECT ||
        t.type === TargetType.OBJECT_FUNCTION
      );
    });
  }

  getActionableTargetsByType(type: TargetType): SubTarget[] {
    return this.getActionableTargets().filter((t) => t.type === type);
  }
}
