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

import { ExtensionManager, Module, Tool } from "@syntest/module";
import yargs = require("yargs");

import { getConfigCommand } from "./commands/config";
import { getModuleCommand } from "./commands/module";

export default class InitModule extends Module {
  constructor() {
    super(
      // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").name,
      // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").version
    );
  }

  register(extensionManager: ExtensionManager): void | Promise<void> {
    const name = "init";

    const labels = ["init"];
    const commands = [
      getConfigCommand(name, extensionManager),
      getModuleCommand(name, extensionManager),
    ];

    const additionalOptions: Map<string, yargs.Options> = new Map();

    const initTool = new Tool(
      name,
      labels,
      "A tool for initializing SynTest projects.",
      commands,
      additionalOptions
    );

    extensionManager.registerTool(initTool);
  }
}
