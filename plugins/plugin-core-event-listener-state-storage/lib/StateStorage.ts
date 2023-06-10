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
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";

import { RootContext, Target } from "@syntest/analysis";
import { ControlFlowProgram, makeSerializeable } from "@syntest/cfg";

export class StateStorage {
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
  }

  controlFlowGraphResolvingComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    cfp: ControlFlowProgram
  ): void {
    this.save(
      // eslint-disable-next-line unicorn/no-null
      JSON.stringify(makeSerializeable(cfp), null, 2),
      filePath,
      "cfg.json"
    );
  }

  abstractSyntaxTreeResolvingComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    ast: S
  ): void {
    if (!filePath.includes("truncate")) {
      return;
    }
    this.save(JSON.stringify(ast), filePath, "ast.json");
  }

  targetExtractionComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    target: Target
  ): void {
    if (!filePath.includes("truncate")) {
      return;
    }
    this.save(JSON.stringify(target), filePath, "target.json");
  }

  dependencyResolvingComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    dependencies: string[]
  ): void {
    if (!filePath.includes("truncate")) {
      return;
    }
    this.save(
      JSON.stringify({ depedencies: dependencies }),
      filePath,
      "dependencies.json"
    );
  }

  save(
    data: string,
    filePath: string,
    type: "cfg.json" | "ast.json" | "target.json" | "dependencies.json"
  ) {
    const name = path.basename(filePath, path.extname(filePath));

    const directory = path.join(this.storagePath, name);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    const savePath = path.join(directory, type);
    writeFileSync(savePath, data);
  }
}
