import { Target } from "./Target";
import { CFG } from "./graph/CFG";
import { Properties } from "../../properties";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const globby = require("globby");

export abstract class TargetPool {
  private _targets: Target[];

  abstract getSource(targetPath: string): string;
  abstract getTargetMap(targetPath: string): Map<string, any>;
  abstract getFunctionMap(
    targetPath: string,
    targetName: string
  ): Map<string, any>;

  abstract getCFG(targetPath: string, targetName: string): CFG;
  abstract getAST(targetPath: string): any;

  loadTargets(): void {
    let includes = Properties.include;
    let excludes = Properties.exclude;

    if (typeof includes === "string") {
      includes = [includes];
    }

    if (typeof excludes === "string") {
      excludes = [excludes];
    }

    // Mapping filepath -> targets
    const includedMap = new Map<string, string[]>();
    const excludedMap = new Map<string, string[]>();

    includes.forEach((include) => {
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
    excludes.forEach((exclude) => {
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
  }

  get targets(): Target[] {
    return this._targets;
  }
}
