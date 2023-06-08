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

import { SerializableControlFlowProgram } from "./SerializableControlFlowProgram";

export function makeNonSerializable(
  serializableCfp: SerializableControlFlowProgram
): ControlFlowProgram {
  return {
    graph: new ControlFlowGraph(
      serializableCfp.nodes.find((value) => value.id === serializableCfp.entry),
      serializableCfp.nodes.find(
        (value) => value.id === serializableCfp.successExit
      ),
      serializableCfp.nodes.find(
        (value) => value.id === serializableCfp.errorExit
      ),
      new Map(serializableCfp.nodes.map((node) => [node.id, node])),
      serializableCfp.edges
    ),
    functions: serializableCfp.functions.map((function_) => {
      return {
        id: function_.id,
        name: function_.name,
        graph: new ControlFlowGraph(
          function_.nodes.find((value) => value.id === function_.entry),
          function_.nodes.find((value) => value.id === function_.successExit),
          function_.nodes.find((value) => value.id === function_.errorExit),
          new Map(function_.nodes.map((node) => [node.id, node])),
          function_.edges
        ),
      };
    }),
  };
}
