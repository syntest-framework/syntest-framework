import { TargetPool } from "./TargetPool";
import { TargetFile } from "./TargetFile";
import { Properties } from "../../properties";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const globby = require("globby");

export async function loadTargets(targetPool: TargetPool): Promise<void> {
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

  const includedTargets: TargetFile[] = [];
  const excludedTargets: TargetFile[] = [];

  for (const _path of includedMap.keys()) {
    includedTargets.push({
      source: targetPool.getSource(_path),
      canonicalPath: _path,
      relativePath: path.basename(_path),
      targets: includedMap.get(_path),
    });
  }

  for (const _path of excludedMap.keys()) {
    excludedTargets.push({
      source: targetPool.getSource(_path),
      canonicalPath: _path,
      relativePath: path.basename(_path),
      targets: excludedMap.get(_path),
    });
  }

  targetPool.included = includedTargets;
  targetPool.excluded = excludedTargets;
}

export function getCommonBasePath(targets: TargetFile[]): string {
  if (targets.length === 0) {
    return "";
  }

  const pathA = targets[0].canonicalPath;
  let finalCommonPathLength = pathA.length;

  for (let t = 1; t < targets.length; t++) {
    const pathB = targets[t].canonicalPath;

    let commonPathLength = 0;

    for (let i = 0; i < Math.min(pathA.length, pathB.length); i++) {
      if (pathA[i] !== pathB[i]) {
        break;
      }
      commonPathLength = i;
    }

    finalCommonPathLength = Math.min(commonPathLength, finalCommonPathLength);
  }

  return pathA.substring(0, finalCommonPathLength);
}
