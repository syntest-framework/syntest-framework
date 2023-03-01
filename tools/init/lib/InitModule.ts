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

import { Command, Module, Plugin, Tool } from "@syntest/cli";
import yargs = require("yargs");

export default class InitModule extends Module {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    super("init", require("../package.json").version);
  }

  async getTools(): Promise<Tool[]> {
    const labels = ["init"];

    const commandOptions: Map<string, yargs.Options> = new Map();
    commandOptions.set("test-config", {
      alias: [],
      default: "test",
      description: "test test",
      group: "Test options:",
      hidden: false,
      normalize: true,
      type: "string",
    });

    const commands = [
      new Command(
        this.name,
        "xsubcommandxx",
        "thorough description",
        commandOptions,
        (args) => {
          console.log("config subcommand given!");
          console.log(args);
        }
      ),
    ];

    const additionalOptions: Map<string, yargs.Options> = new Map();
    additionalOptions.set("test", {
      alias: [],
      default: "test",
      description: "test test",
      group: "Test options:",
      hidden: false,
      normalize: true,
      type: "string",
    });

    const initTool = new Tool(
      this.name,
      labels,
      "init description",
      commands,
      additionalOptions,
      (args) => {
        console.log("no subcommand given");
        console.log(args);
      }
    );

    return [initTool];
  }
  async getPlugins(): Promise<Plugin[]> {
    return [];
  }
}
