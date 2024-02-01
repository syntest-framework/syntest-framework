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
import { writeFileSync } from "node:fs";
import * as path from "node:path";

import {
  Command,
  ExtensionManager,
  extractArgumentValues,
} from "@syntest/module";
import Yargs = require("yargs");

export function getConfigCommand(
  tool: string,
  moduleManager: ExtensionManager
): Command {
  const options = new Map<string, Yargs.Options>();

  return new Command(
    moduleManager,
    tool,
    "config",
    "Create a configuration file for the tool.",
    options,
    (arguments_: Yargs.ArgumentsCamelCase) => {
      const allOptions: { [key: string]: unknown } = extractArgumentValues(
        arguments_,
        moduleManager
      );

      writeFileSync(
        path.resolve(".syntest.json"),
        JSON.stringify(allOptions, undefined, 2)
      );
    }
  );
}
