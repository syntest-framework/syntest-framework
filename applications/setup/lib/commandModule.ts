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
import { Argv } from "yargs";

export const command = "setup";

export const aliases: string[] = [];
export const describe = "Setup the requirements for the SynTest tool";

export const builder = (yargs: Argv) => {
  return yargs
    .options({
      "syntest-directory": {
        alias: [],
        default: "syntest",
        description: "The path where everything should be saved",
        group: "Directory options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
    })
    .usage("Usage: $0 setup [options]")
    .version(false)
    .help(true);
};

export const handler = (argv) => {
  console.log("called with args", argv);
  setTimeout(() => {
    console.log("time");
  }, 2000);
  //   Configuration.initialize(argv);
  // example
  // const eventManager = new EventManager({})
  // const pluginManager = new PluginManager()
  // const launcher = new Launcher(eventManager, pluginManager)
  // launcher.run()
};
