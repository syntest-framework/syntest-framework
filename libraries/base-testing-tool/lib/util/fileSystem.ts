/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import * as path from "node:path";

export function createDirectoryStructure(directories: string[]) {
  for (const directory of directories) {
    mkdirSync(directory, {
      recursive: true,
    });
  }
}

export function deleteDirectories(directories: string[]) {
  for (const directory of directories) {
    if (!existsSync(directory)) {
      continue;
    }
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
}

export function clearDirectory(directory: string) {
  if (!existsSync(directory)) {
    return;
  }
  const files = readdirSync(directory);
  for (const file of files) {
    unlinkSync(path.join(directory, file));
  }
}
