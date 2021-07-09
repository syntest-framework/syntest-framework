import { mkdirSync, readFileSync, rmdirSync } from "fs";
const globby = require("globby");
import * as path from "path";
import { Properties } from "../properties";

export async function createDirectoryStructure() {
  // outputs
  await mkdirSync(Properties.statistics_directory, {
    recursive: true,
  });
  await mkdirSync(Properties.log_directory, { recursive: true });
  await mkdirSync(Properties.final_suite_directory, {
    recursive: true,
  });
  await mkdirSync(Properties.cfg_directory, { recursive: true });
}

export async function createTempDirectoryStructure() {
  // temp
  await mkdirSync(Properties.temp_test_directory, { recursive: true });
  await mkdirSync(Properties.temp_log_directory, { recursive: true });
}

export async function deleteTempDirectories() {
  await rmdirSync(Properties.temp_test_directory, { recursive: true });
  await rmdirSync(Properties.temp_log_directory, { recursive: true });

  await rmdirSync(`.syntest`, { recursive: true });
}

export async function loadTargetFiles(): Promise<{
  [key: string]: TargetFile[];
}> {
  let includes = Properties.include;
  let excludes = Properties.exclude;

  if (typeof includes === "string") {
    includes = [includes];
  }

  if (typeof excludes === "string") {
    excludes = [excludes];
  }

  includes = includes.map((include) => {
    if (include.includes('->')) {
      return include.split('->')[0]
    }

    return include
  })

  // only exclude files if all contracts are excluded
  excludes = excludes
      .filter((exclude) => {
        return !exclude.includes('->')
      })

  const includePaths = globby.sync(includes);
  const excludePaths = globby.sync(excludes);

  let includedTargets: TargetFile[] = [];
  let excludedTargets: TargetFile[] = [];

  const promises = [];

  includePaths.forEach((_path) => {
    promises.push(
      new Promise(async (resolve) => {
        includedTargets.push({
          canonicalPath: path.resolve(_path),
          relativePath: path.basename(_path),
          source: await readFileSync(_path).toString(),
          contracts: []
        });
        resolve(null);
      })
    );
  });

  excludePaths.forEach((_path) => {
    promises.push(
      new Promise(async (resolve) => {
        excludedTargets.push({
          canonicalPath: path.resolve(_path),
          relativePath: path.basename(_path),
          source: await readFileSync(_path).toString(),
          contracts: []
        });
        resolve(null);
      })
    );
  });

  await Promise.all(promises);

  includedTargets = includedTargets.filter(
    (a) => !excludedTargets.find((b) => a.canonicalPath === b.canonicalPath)
  );

  return { included: includedTargets, excluded: excludedTargets };
}

export interface TargetFile {
  canonicalPath: string;
  relativePath: string;
  source: string;
  contracts: string[];
}
