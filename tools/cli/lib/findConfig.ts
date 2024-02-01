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

import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";

export function findConfig(): string | undefined {
  const configs = [".syntest.json"];

  let directory = process.cwd();
  const { root } = path.parse(directory);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (const config of configs) {
      try {
        const filepath = path.resolve(directory, config);
        const stat = fs.statSync(filepath, {
          throwIfNoEntry: false,
        });

        if (stat && stat.isFile()) {
          return filepath;
        }
      } catch {
        /* empty */
      }
    }

    if (directory === root) {
      break;
    }

    directory = path.dirname(directory);
  }

  return undefined;
}
