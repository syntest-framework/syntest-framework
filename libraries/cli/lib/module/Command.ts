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
import Yargs = require("yargs");

export class Command implements Yargs.CommandModule {
  tool: Readonly<string>;
  command: Readonly<string>;
  options: Map<string, Yargs.Options>;
  handler: (args: Yargs.ArgumentsCamelCase) => void | Promise<void>;

  describe: "text for desribe";

  constructor(
    tool: string,
    name: string,
    options: Map<string, Yargs.Options>,
    handler: (args: Yargs.ArgumentsCamelCase) => void | Promise<void>
  ) {
    this.tool = tool;
    this.command = name;
    this.options = options;
    this.handler = handler;
  }

  builder = (yargs: Yargs.Argv) => {
    for (const option of this.options.keys()) {
      yargs = yargs.option(option, this.options.get(option));
    }
    return yargs.usage(`Usage: $0 ${this.tool} ${this.command} [options]`);
  };
}
