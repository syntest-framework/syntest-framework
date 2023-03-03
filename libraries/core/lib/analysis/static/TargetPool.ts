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
import * as path from "path";

import { ControlFlowGraph } from "@syntest/cfg-core";
import globby = require("globby");
import TypedEventEmitter from "typed-emitter";

import { Encoding } from "../../search/Encoding";
import { Events } from "../../util/Events";

import { ActionDescription } from "./ActionDescription";
import { Target } from "./Target";
import { TargetMetaData } from "./TargetMetaData";

export abstract class TargetPool<T extends Encoding> {
  protected _targets: Target[];

  abstract getSource(targetPath: string): string;
  abstract getTargetMap(targetPath: string): Map<string, TargetMetaData>;
  abstract getFunctionMaps<A extends ActionDescription>(
    targetPath: string
  ): Map<string, Map<string, A>>;
  abstract getFunctionMap<A extends ActionDescription>(
    targetPath: string,
    targetName: string
  ): Map<string, A>;

  abstract getCFG(targetPath: string, targetName: string): ControlFlowGraph;
  abstract getAST(targetPath: string): unknown;

  loadTargets(include: string[], exclude: string[]): void {
    (<TypedEventEmitter<Events>>process).emit("targetLoadStart", this);

    // Mapping filepath -> targets
    const includedMap = new Map<string, string[]>();
    const excludedMap = new Map<string, string[]>();

    include.forEach((include) => {
      let _path;
      let target;
      if (include.includes(":")) {
        _path = include.split(":")[0];
        target = include.split(":")[1];
      } else {
        _path = include;
        target = "*";
      }

      const actualPaths = globby.sync(_path);

      for (let _path of actualPaths) {
        _path = path.resolve(_path);
        if (!includedMap.has(_path)) {
          includedMap.set(_path, []);
        }

        includedMap.get(_path).push(target);
      }
    });

    // only exclude files if all contracts are excluded
    exclude.forEach((exclude) => {
      let _path;
      let target;
      if (exclude.includes(":")) {
        _path = exclude.split(":")[0];
        target = exclude.split(":")[1];
      } else {
        _path = exclude;
        target = "*";
      }

      const actualPaths = globby.sync(_path);

      for (let _path of actualPaths) {
        _path = path.resolve(_path);
        if (!excludedMap.has(_path)) {
          excludedMap.set(_path, []);
        }

        excludedMap.get(_path).push(target);
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

    const targets: Target[] = [];

    for (const _path of includedMap.keys()) {
      const includedTargets = includedMap.get(_path);
      const targetMap = this.getTargetMap(_path);
      for (const target of targetMap.keys()) {
        // check if included
        if (
          !includedTargets.includes("*") &&
          !includedTargets.includes(target)
        ) {
          continue;
        }

        // check if excluded
        if (excludedMap.has(_path)) {
          const excludedTargets = excludedMap.get(_path);
          if (
            excludedTargets.includes("*") ||
            excludedTargets.includes(target)
          ) {
            continue;
          }
        }

        targets.push({
          canonicalPath: _path,
          targetName: target,
        });
      }
    }

    this._targets = targets;
    (<TypedEventEmitter<Events>>process).emit("targetLoadComplete", this);
  }

  get targets(): Target[] {
    return this._targets;
  }
}
