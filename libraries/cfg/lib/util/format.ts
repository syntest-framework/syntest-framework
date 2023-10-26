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
import { ControlFlowProgram } from "../ControlFlowProgram";

import {
  SerializableControlFlowFunction,
  SerializableControlFlowProgram,
} from "./SerializableControlFlowProgram";

function makeFunctionSerializeable(
  cff: ControlFlowFunction
): SerializableControlFlowFunction {
  return {
    id: cff.id,
    name: cff.name,
    entry: cff.graph.entry.id,
    successExit: cff.graph.successExit.id,
    errorExit: cff.graph.errorExit.id,
    nodes: [...cff.graph.nodes.values()],
    edges: [...cff.graph.edges],
  };
}

export function makeSerializeable(
  cfp: ControlFlowProgram
): SerializableControlFlowProgram {
  const data: SerializableControlFlowProgram = {
    entry: cfp.graph.entry.id,
    successExit: cfp.graph.successExit.id,
    errorExit: cfp.graph.errorExit.id,
    nodes: [...cfp.graph.nodes.values()],
    edges: [...cfp.graph.edges],
    functions: cfp.functions.map((function_) =>
      makeFunctionSerializeable(function_)
    ),
  };

  return data;
}
