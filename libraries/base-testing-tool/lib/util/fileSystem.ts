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

import { mkdirSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import * as path from "node:path";

import { CONFIG } from "../Configuration";

export function createDirectoryStructure() {
  // outputs
  mkdirSync(CONFIG.statisticsDirectory, {
    recursive: true,
  });
  mkdirSync(CONFIG.logDirectory, { recursive: true });
  mkdirSync(CONFIG.testDirectory, {
    recursive: true,
  });
}

export function createTemporaryDirectoryStructure() {
  // temp
  mkdirSync(CONFIG.tempTestDirectory, { recursive: true });
  mkdirSync(CONFIG.tempLogDirectory, { recursive: true });
  mkdirSync(CONFIG.tempInstrumentedDirectory, { recursive: true });
}

export function deleteTemporaryDirectories() {
  rmdirSync(CONFIG.tempTestDirectory, { recursive: true });
  rmdirSync(CONFIG.tempLogDirectory, { recursive: true });
  rmdirSync(CONFIG.tempInstrumentedDirectory, { recursive: true });

  rmdirSync(CONFIG.tempSyntestDirectory, { recursive: true });
}

export function clearDirectory(directory: string) {
  const files = readdirSync(directory);
  for (const file of files) {
    unlinkSync(path.join(directory, file));
  }
}
