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

import { RootContext, SubTarget, Target } from "@syntest/analysis";
import { isFailure, unwrap } from "@syntest/diagnostics";
import { getLogger, Logger } from "@syntest/logging";
import globby = require("globby");
import TypedEventEmitter from "typed-emitter";

import { Events } from "./Events";

export class TargetSelector {
  protected static LOGGER: Logger;
  protected _rootContext: RootContext<unknown>;

  constructor(rootContext: RootContext<unknown>) {
    TargetSelector.LOGGER = getLogger(TargetSelector.name);
    this._rootContext = rootContext;
  }

  private _parseTargetStrings(targetStrings: string[]): Map<string, string[]> {
    const targetMap = new Map<string, string[]>();

    for (const included of targetStrings) {
      let globbedPath;
      let targets;
      if (included.includes(":")) {
        const split = included.split(":");
        globbedPath = split[0];
        targets = split[1].split(",");
      } else {
        globbedPath = included;
        targets = ["*"];
      }

      const actualPaths = globby.sync(globbedPath);

      for (let _path of actualPaths) {
        _path = path.resolve(_path);
        if (!targetMap.has(_path)) {
          targetMap.set(_path, []);
        }

        targetMap.get(_path).push(...targets);
      }
    }

    return targetMap;
  }

  loadTargets(include: string[], exclude: string[]): Target[] {
    (<TypedEventEmitter<Events>>process).emit(
      "targetLoadStart",
      this._rootContext,
    );

    // Mapping filepath -> targets
    const includedMap = this._parseTargetStrings(include);
    const excludedMap = this._parseTargetStrings(exclude);

    const targetContexts: Target[] = [];

    for (const _path of includedMap.keys()) {
      const includedSubTargets = new Set(includedMap.get(_path));
      const excludedSubTargets = new Set(excludedMap.get(_path));
      const result = this._rootContext.getSubTargets(_path);

      if (isFailure(result)) {
        TargetSelector.LOGGER.error(result.error.message);
        continue;
      }

      const subTargets = unwrap(result);

      const selectedSubTargets: SubTarget[] = [];

      for (const target of subTargets) {
        if (
          this.shouldAddSubTarget(
            target,
            includedSubTargets,
            excludedSubTargets,
          )
        ) {
          selectedSubTargets.push(target);
        }
      }

      targetContexts.push({
        path: _path,
        name: path.basename(_path),
        subTargets: selectedSubTargets,
      });
    }

    (<TypedEventEmitter<Events>>process).emit(
      "targetLoadComplete",
      this._rootContext,
    );
    return targetContexts;
  }

  protected shouldAddSubTarget(
    target: SubTarget,
    included: Set<string>,
    excluded: Set<string> | undefined,
  ) {
    // check if included
    if (!included.has("*") && !included.has(target.id)) {
      return false;
    }

    // check if excluded
    return !(excluded && (excluded.has("*") || excluded.has(target.id)));
  }
}
