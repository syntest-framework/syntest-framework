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

export function format(cfp: ControlFlowProgram): string {
  const data = {
    entry: cfp.graph.entry.id,
    successExit: cfp.graph.successExit.id,
    errorExit: cfp.graph.errorExit.id,
    nodes: [...cfp.graph.nodes.values()],
    edges: [...cfp.graph.edges],
    functions: cfp.functions.map((function_) => {
      return {
        id: function_.id,
        name: function_.name,
        entry: function_.graph.entry.id,
        successExit: function_.graph.successExit.id,
        errorExit: function_.graph.errorExit.id,
        nodes: [...function_.graph.nodes.entries()],
        edges: [...function_.graph.edges],
      };
    }),
  };

  // sadly all contraction data is lost

  return JSON.stringify(data, undefined, 2);
}
