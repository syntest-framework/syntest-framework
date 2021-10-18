/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import {
  mkdirSync,
  readdir,
  readdirSync,
  readFileSync,
  rmdirSync,
  unlink,
  unlinkSync,
} from "fs";
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

export async function loadTargets(): Promise<
  [Map<string, string[]>, Map<string, string[]>]
> {
  let includes = Properties.include;
  let excludes = Properties.exclude;

  if (typeof includes === "string") {
    includes = [includes];
  }

  if (typeof excludes === "string") {
    excludes = [excludes];
  }

  // Mapping filepath -> targets
  const includedTargets = new Map<string, string[]>();
  const excludedTargets = new Map<string, string[]>();

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
      if (!includedTargets.has(_path)) {
        includedTargets.set(_path, []);
      }

      includedTargets.get(_path).push(target);
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
      if (!excludedTargets.has(_path)) {
        excludedTargets.set(_path, []);
      }

      excludedTargets.get(_path).push(target);
    }
  });

  for (const key of excludedTargets.keys()) {
    if (includedTargets.has(key)) {
      if (excludedTargets.get(key).includes("*")) {
        // exclude all targets of the file
        includedTargets.delete(key);
      } else {
        // exclude specific targets in the file
        includedTargets.set(
          key,
          includedTargets
            .get(key)
            .filter((target) => !excludedTargets.get(key).includes(target))
        );
      }
    }
  }

  return [includedTargets, excludedTargets];
}

export async function clearDirectory(directory: string) {
  const files = await readdirSync(directory);
  for (const file of files) {
    await unlinkSync(path.join(directory, file));
  }
}
