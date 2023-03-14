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

import { Module, Plugin, Tool } from "@syntest/module";
import { getConfigCommand } from "./commands/config";
import yargs = require("yargs");
import { getModuleCommand } from "./commands/module";
import { Metric } from "@syntest/metric";

export default class InitModule extends Module {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    super("init", require("../package.json").version);
  }

  async getTools(): Promise<Tool[]> {
    const labels = ["init"];
    const commands = [
      getConfigCommand(this.name, this.modules),
      getModuleCommand(this.name),
    ];

    const additionalOptions: Map<string, yargs.Options> = new Map();

    const initTool = new Tool(
      this.name,
      labels,
      "A tool for initializing SynTest projects.",
      commands,
      additionalOptions
    );

    return [initTool];
  }
  async getPlugins(): Promise<Plugin[]> {
    return [];
  }

  async getMetrics(): Promise<Metric[]> {
    return [];
  }
}
