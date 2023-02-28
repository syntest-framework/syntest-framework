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

import { Encoding, ListenerInterface, ProgramState } from "@syntest/core";
import { createSimulation } from "./D3Simulation";
import { GraphOptions } from "./GraphingPlugin";
import fs = require("fs");
import { CONFIG } from "@syntest/base-testing-tool";

export class CFGGraphingListener<T extends Encoding>
  implements ListenerInterface<T>
{
  private done: Map<string, Set<string>>;

  constructor() {
    this.done = new Map();
  }

  async onControlFlowGraphResolvingComplete(
    state: ProgramState<T>
  ): Promise<void> {
    let count = 0;
    for (const target of state.targetPool.targets) {
      count += 1;
      if (!this.done.has(target.canonicalPath)) {
        this.done.set(target.canonicalPath, new Set());
      }

      if (this.done.get(target.canonicalPath).has(target.targetName)) {
        continue;
      }

      const cfg = state.targetPool.getCFG(
        target.canonicalPath,
        target.targetName
      );

      const svgHtml = await createSimulation(cfg);

      const base = (<GraphOptions>(<unknown>CONFIG)).cfgDirectory;
      const path = `${base}/test.svg`;
      await fs.writeFileSync(path, svgHtml);
    }
  }
}
