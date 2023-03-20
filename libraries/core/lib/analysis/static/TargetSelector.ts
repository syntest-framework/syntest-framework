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
import TypedEventEmitter from "typed-emitter";
import { SubTarget, Target } from "./Target";
import { RootContext } from "./RootContext";
import { Events } from "../../util/Events";
import * as path from "path";
import globby = require("globby");

export class TargetSelector {
  private _rootContext: RootContext;

  constructor(rootContext: RootContext) {
    this._rootContext = rootContext;
  }

  loadTargets(include: string[], exclude: string[]): Target[] {
    (<TypedEventEmitter<Events>>process).emit(
      "targetLoadStart",
      this._rootContext
    );

    // Mapping filepath -> targets
    const includedMap = new Map<string, string[]>();
    const excludedMap = new Map<string, string[]>();

    include.forEach((include) => {
      let _path;
      let targets;
      if (include.includes(":")) {
        const split = include.split(":");
        _path = split[0];
        targets = split[1].split(",");
      } else {
        _path = include;
        targets = ["*"];
      }

      const actualPaths = globby.sync(_path);

      for (let _path of actualPaths) {
        _path = path.resolve(_path);
        if (!includedMap.has(_path)) {
          includedMap.set(_path, []);
        }

        includedMap.get(_path).push(...targets);
      }
    });

    // only exclude files if all sub-targets are excluded
    exclude.forEach((exclude) => {
      let _path;
      let targets;
      if (exclude.includes(":")) {
        const split = exclude.split(":");
        _path = split[0];
        targets = split[1].split(",");
      } else {
        _path = exclude;
        targets = ["*"];
      }

      const actualPaths = globby.sync(_path);

      for (let _path of actualPaths) {
        _path = path.resolve(_path);
        if (!excludedMap.has(_path)) {
          excludedMap.set(_path, []);
        }

        excludedMap.get(_path).push(...targets);
      }
    });

    const targetContexts: Target[] = [];

    for (const _path of includedMap.keys()) {
      const includedSubTargets = includedMap.get(_path);
      const subTargets = this._rootContext.getSubTargets(_path);

      const selectedSubTargets: SubTarget[] = [];

      for (const target of subTargets) {
        // check if included
        if (
          !includedSubTargets.includes("*") &&
          !includedSubTargets.includes(target.id)
        ) {
          continue;
        }

        // check if excluded
        if (excludedMap.has(_path)) {
          const excludedSubTargets = excludedMap.get(_path);
          if (
            excludedSubTargets.includes("*") ||
            excludedSubTargets.includes(target.id)
          ) {
            continue;
          }
        }

        selectedSubTargets.push(target);
      }

      targetContexts.push({
        path: _path,
        name: path.basename(_path),
        subTargets: selectedSubTargets,
      });
    }

    (<TypedEventEmitter<Events>>process).emit(
      "targetLoadComplete",
      this._rootContext
    );
    return targetContexts;
  }
}
