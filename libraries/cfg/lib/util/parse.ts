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
import { ControlFlowProgram } from "../ControlFlowProgram";
import { ControlFlowGraph } from "../graph/ControlFlowGraph";
import { EdgeType } from "../graph/EdgeType";
import { MetaData, Statement } from "../graph/Node";
import { NodeType } from "../graph/NodeType";

type Node = {
  id: string;
  type: NodeType;
  label: string;
  statements: Statement[];
  metadata: MetaData;
  description?: string;
};

type Edge = {
  id: string;
  type: EdgeType;
  label: string;
  source: string;
  target: string;
  description?: string;
};

export type ExpectedData = {
  entry: string;
  successExit: string;
  errorExit: string;
  nodes: Node[];
  edges: Edge[];
  functions: {
    id: string;
    name: string;
    entry: string;
    successExit: string;
    errorExit: string;
    nodes: Node[];
    edges: Edge[];
  }[];
};

export function parse(data: string): ControlFlowProgram {
  const dataObject = <ExpectedData>JSON.parse(data);

  // sadly all contraction data is lost

  return {
    graph: new ControlFlowGraph(
      dataObject.nodes.find((value) => value.id === dataObject.entry),
      dataObject.nodes.find((value) => value.id === dataObject.successExit),
      dataObject.nodes.find((value) => value.id === dataObject.errorExit),
      new Map(dataObject.nodes.map((node) => [node.id, node])),
      dataObject.edges
    ),
    functions: dataObject.functions.map((function_) => {
      return {
        id: function_.id,
        name: function_.name,
        graph: new ControlFlowGraph(
          dataObject.nodes.find((value) => value.id === function_.entry),
          dataObject.nodes.find((value) => value.id === function_.successExit),
          dataObject.nodes.find((value) => value.id === function_.errorExit),
          new Map(function_.nodes.map((node) => [node.id, node])),
          function_.edges
        ),
      };
    }),
  };
}
