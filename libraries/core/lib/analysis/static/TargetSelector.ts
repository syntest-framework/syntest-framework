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
import { Target } from "./Target";
import { RootContext } from "./RootContext";
import { Events } from "../../util/Events";
import * as path from "path";
import globby = require("globby");

export class TargetSelector {
  private _rootContext: RootContext;

  constructor(rootContext: RootContext) {
    this._rootContext = rootContext;
  }

  private convertStringToTargetIds(included: string): string[] {
    const options = included.split(",");

    const includedIds: string[] = [];

    for (const option of options) {
      includedIds.push(option);
    }

    return includedIds;
  }

  loadTargets(include: string[], exclude: string[]): Map<string, Target> {
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
        targets = this.convertStringToTargetIds(split[1]);
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

    // only exclude files if all contracts are excluded
    exclude.forEach((exclude) => {
      let _path;
      let targets;
      if (exclude.includes(":")) {
        const split = exclude.split(":");
        _path = split[0];
        targets = this.convertStringToTargetIds(split[1]);
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

    for (const key of excludedMap.keys()) {
      if (includedMap.has(key)) {
        if (excludedMap.get(key).includes("*")) {
          // exclude all targets of the file
          includedMap.delete(key);
        } else {
          // exclude specific targets in the file
          includedMap.set(
            key,
            includedMap
              .get(key)
              .filter((target) => !excludedMap.get(key).includes(target))
          );
        }
      }
    }

    const targetContexts: Map<string, Target> = new Map();

    for (const _path of includedMap.keys()) {
      const finalTargets = [];
      const target = path.basename(_path);

      const includedTargets = includedMap.get(_path);
      const targets = this._rootContext.getSubTargets(_path);

      for (const target of targets) {
        // check if included
        if (
          !includedTargets.includes("*") &&
          !includedTargets.includes(target.id)
        ) {
          continue;
        }

        // check if excluded
        if (excludedMap.has(_path)) {
          const excludedTargets = excludedMap.get(_path);
          if (
            excludedTargets.includes("*") ||
            excludedTargets.includes(target.id)
          ) {
            continue;
          }
        }

        finalTargets.push(target);
      }

      targetContexts.set(_path, {
        path: _path,
        name: target,
        subTargets: finalTargets,
      });
    }

    (<TypedEventEmitter<Events>>process).emit(
      "targetLoadComplete",
      this._rootContext
    );
    return targetContexts;
  }
}
