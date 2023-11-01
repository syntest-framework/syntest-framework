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
import * as path from "node:path";

import { RootContext, Target } from "@syntest/analysis";
import { ControlFlowProgram, makeSerializeable } from "@syntest/cfg";
import { Encoding, SearchAlgorithm, SearchSubject } from "@syntest/search";
import { StorageManager } from "@syntest/storage";

export class StateStorage {
  private storageManager: StorageManager;
  private storagePath: string;

  constructor(storageManager: StorageManager, storagePath: string) {
    this.storageManager = storageManager;
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
    this.save(JSON.stringify(ast, undefined, 2), filePath, "ast.json");
  }

  targetExtractionComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    target: Target
  ): void {
    this.save(JSON.stringify(target, undefined, 2), filePath, "target.json");
  }

  dependencyResolvingComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    dependencies: string[]
  ): void {
    this.save(
      JSON.stringify({ depedencies: dependencies }, undefined, 2),
      filePath,
      "dependencies.json"
    );
  }

  sortFunction = (a: string, b: string): number => {
    const partsA = a.replace("placeholder:::", "").split(":::");
    const partsB = b.replace("placeholder:::", "").split(":::");
    const [indexStartA, indexEndA] = partsA[2]
      .split(":")
      .map((x) => Number.parseInt(x));
    const [indexStartB, indexEndB] = partsB[2]
      .split(":")
      .map((x) => Number.parseInt(x));

    if (indexStartA < indexStartB) {
      return -1;
    } else if (indexStartA > indexStartB) {
      return 1;
    }

    // equal start
    if (indexEndA < indexEndB) {
      return -1;
    } else if (indexEndA > indexEndB) {
      return 1;
    }

    return 0;
  };

  searchComplete<E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    subject: SearchSubject<E>
  ): void {
    const covered = searchAlgorithm
      .getObjectiveManager()
      .getCoveredObjectives();
    const uncovered = searchAlgorithm
      .getObjectiveManager()
      .getUncoveredObjectives();
    const filePath = subject.path;

    this.save(
      JSON.stringify(
        {
          covered: [...covered]
            .map((objective) => objective.getIdentifier())
            .sort(this.sortFunction),
          uncovered: [...uncovered]
            .map((objective) => objective.getIdentifier())
            .sort(this.sortFunction),
        },
        undefined,
        2
      ),
      filePath,
      "covered.json"
    );
  }

  save(
    data: string,
    filePath: string,
    type:
      | "cfg.json"
      | "ast.json"
      | "target.json"
      | "dependencies.json"
      | "covered.json"
  ) {
    const name = path.basename(filePath, path.extname(filePath));

    this.storageManager.store([this.storagePath, name], type, data);
  }
}
