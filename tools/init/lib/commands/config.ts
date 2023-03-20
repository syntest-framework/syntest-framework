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
import { Command, Module, ModuleManager } from "@syntest/module";
import { writeFileSync } from "fs";
import Yargs = require("yargs");
import * as path from "path";

export function getConfigCommand(
  tool: string,
  moduleManager: ModuleManager
): Command {
  const options = new Map<string, Yargs.Options>();

  return new Command(
    tool,
    "config",
    "Create a configuration file for the tool.",
    options,
    async (args: Yargs.ArgumentsCamelCase) => {
      const allOptions = {};

      // Set default values for each option provided by the modules
      for (const tool of moduleManager.tools.values()) {
        for (const [name, option] of tool.toolOptions.entries()) {
          allOptions[name] = option.default || null;
        }

        for (const command of tool.commands) {
          for (const [name, option] of command.options.entries()) {
            allOptions[name] = option.default || null;
          }
        }
      }

      // Set the values provided by the user
      for (const arg of Object.keys(args)) {
        if (
          arg.includes("_") ||
          /[A-Z]/.test(arg) ||
          arg === "_" ||
          arg.length === 1 ||
          arg === "help" ||
          arg === "version" ||
          arg === "$0"
        ) {
          continue;
        }
        allOptions[arg] = args[arg];
      }

      writeFileSync(
        path.resolve(".syntest.json"),
        JSON.stringify(allOptions, null, 2)
      );
    }
  );
}
