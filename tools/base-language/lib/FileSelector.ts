/*
 * Copyright 2020-2023 SynTest contributors
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
import * as path from "node:path";

import globby = require("globby");

export class FileSelector {
  private _parsePaths(paths: string[]): Set<string> {
    const targetMap = new Set<string>();

    for (const globbedPath of paths) {
      const actualPaths = globby.sync(globbedPath);

      for (const path_ of actualPaths) {
        const absolutePath = path.resolve(path_);
        targetMap.add(absolutePath);
      }
    }

    return targetMap;
  }

  loadFilePaths(include: string[], exclude: string[]): Set<string> {
    const includedPaths = this._parsePaths(include);
    const excludedPaths = this._parsePaths(exclude);

    const paths = new Set<string>();

    for (const path_ of includedPaths.keys()) {
      if (!excludedPaths.has(path_)) {
        paths.add(path_);
      }
    }

    return paths;
  }
}
