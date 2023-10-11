/*
 * Copyright 2020-2023 SynTest contributors
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
import { LoggingOptions } from "@syntest/logging";
import Yargs = require("yargs");

export type GeneralOptions = {
  config: string;
  preset: string;
};

export type ModuleOptions = {
  modules: string[];
};

export type BaseOptions = GeneralOptions & LoggingOptions & ModuleOptions;

export enum OptionGroups {
  General = "General Options:",
  Module = "Module Options:",
}

export const Configuration = {
  configureUsage() {
    return (
      Yargs.usage(`Usage: syntest <tool> <command> [options]`)

        // TODO examples
        .epilog("visit https://syntest.org for more documentation")
    );
  },

  configureOptions(yargs: Yargs.Argv) {
    return yargs
      .option("config", {
        alias: ["c"],
        default: ".syntest.json",
        description: "The syntest configuration file",
        group: OptionGroups.General,
        hidden: false,
        config: true,
        type: "string",
      })
      .option("preset", {
        alias: [],
        default: "none",
        description: "The preset you want to use",
        group: OptionGroups.General,
        hidden: false,
        type: "string",
      })
      .option("modules", {
        alias: ["m"],
        array: true,
        default: [],
        description: "List of dependencies or paths to modules to load",
        group: OptionGroups.Module,
        hidden: false,
        type: "string",
      });
  },
};
