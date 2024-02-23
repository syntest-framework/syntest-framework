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

import { ControlFlowProgram } from "@syntest/cfg";

import { Encoding } from "../../Encoding";

import { FunctionObjectiveFunction } from "./FunctionObjectiveFunction";

export function extractFunctionObjectivesFromProgram<T extends Encoding>(
  cfp: ControlFlowProgram,
) {
  const functions: FunctionObjectiveFunction<T>[] = [];
  for (const cff of cfp.functions) {
    // TODO some functions are actually children of other functions!
    functions.push(new FunctionObjectiveFunction(cff.id));
  }

  return functions;
}
