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

import { mkdirSync, readdirSync, rmdirSync, unlinkSync } from "fs";
import * as path from "path";
import { CONFIG } from "../Launcher";

export async function createDirectoryStructure() {
  // outputs
  await mkdirSync(CONFIG.statisticsDirectory, {
    recursive: true,
  });
  await mkdirSync(CONFIG.logDirectory, { recursive: true });
  await mkdirSync(CONFIG.finalSuiteDirectory, {
    recursive: true,
  });
  await mkdirSync(CONFIG.cfgDirectory, { recursive: true });
}

export async function createTempDirectoryStructure() {
  // temp
  await mkdirSync(CONFIG.tempTestDirectory, { recursive: true });
  await mkdirSync(CONFIG.tempLogDirectory, { recursive: true });
  await mkdirSync(CONFIG.tempInstrumentedDirectory, { recursive: true });
}

export async function deleteTempDirectories() {
  await rmdirSync(CONFIG.tempTestDirectory, { recursive: true });
  await rmdirSync(CONFIG.tempLogDirectory, { recursive: true });
  await rmdirSync(CONFIG.tempInstrumentedDirectory, { recursive: true });

  await rmdirSync(`.syntest`, { recursive: true });
}

export async function clearDirectory(directory: string) {
  const files = await readdirSync(directory);
  for (const file of files) {
    await unlinkSync(path.join(directory, file));
  }
}
