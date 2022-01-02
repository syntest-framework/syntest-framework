import { Target, TargetFile } from "./TargetFile";
import { CFG } from "./graph/CFG";
import { Properties } from "../../properties";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const globby = require("globby");

export abstract class TargetPool {
  private _targetFiles: TargetFile[];
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

    const included: TargetFile[] = [];
    const excluded: TargetFile[] = [];

    for (const _path of includedMap.keys()) {
      included.push({
        source: this.getSource(_path),
        canonicalPath: _path,
        relativePath: path.basename(_path),
        targets: includedMap.get(_path),
      });
    }

    for (const _path of excludedMap.keys()) {
      excluded.push({
        source: this.getSource(_path),
        canonicalPath: _path,
        relativePath: path.basename(_path),
        targets: excludedMap.get(_path),
      });
    }

    const excludedSet = new Set(
      ...excluded.map((x) => x.canonicalPath)
    );

    const targets: Target[] = []

    for (const targetFile of included) {
      const includedTargets = targetFile.targets;

      const targetMap = this.getTargetMap(targetFile.canonicalPath);
      for (const target of targetMap.keys()) {
        // check if included
        if (
          !includedTargets.includes("*") &&
          !includedTargets.includes(target)
        ) {
          continue;
        }

        // check if excluded
        if (excludedSet.has(targetFile.canonicalPath)) {
          const excludedTargets = excluded.find(
            (x) => x.canonicalPath === targetFile.canonicalPath
          ).targets;
          if (
            excludedTargets.includes("*") ||
            excludedTargets.includes(target)
          ) {
            continue;
          }
        }

        targets.push({
          source: targetFile.source,
          canonicalPath: targetFile.canonicalPath,
          relativePath: targetFile.relativePath,
          targetName: target
        })
      }
    }

    this._targetFiles = [...included, ...excluded]
    this._targets = targets
  }


  get targets(): Target[] {
    return this._targets;
  }

  get targetFiles(): TargetFile[] {
    return this._targetFiles;
  }
}
