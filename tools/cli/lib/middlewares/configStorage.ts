/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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

import { extractArgumentValues, ModuleManager } from "@syntest/module";
import { StorageManager } from "@syntest/storage";
import * as yargs from "yargs";

export function storeConfig(
  moduleManager: ModuleManager,
  storageManager: StorageManager,
  arguments_: yargs.ArgumentsCamelCase
): void {
  // Store the arguments
  const argumentsValues = extractArgumentValues(arguments_, moduleManager);
  storageManager.store(
    [],
    ".syntest.json",
    JSON.stringify(argumentsValues, undefined, 2)
  );
}
