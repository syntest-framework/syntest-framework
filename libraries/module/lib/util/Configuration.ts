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
import { LoggingOptions } from "@syntest/logging";

export type GeneralOptions = {
  config: string;
};

export type StorageOptions = {
  syntestDirectory: string;
  tempSyntestDirectory: string;
};

export type ModuleOptions = {
  modules: string[];
};

export type BaseOptions = GeneralOptions &
  StorageOptions &
  LoggingOptions &
  ModuleOptions;

export enum OptionGroups {
  General = "General Options:",
  Storage = "Storage Options:",
  Module = "Module Options:",
}

export class Configuration {
  static configureOptions(yargs: Yargs.Argv) {
    return (
      yargs
        .option("modules", {
          alias: ["m"],
          array: true,
          default: [],
          description: "List of dependencies or paths to modules to load",
          group: OptionGroups.Module,
          hidden: false,
          type: "string",
        })
        // storage
        .options("syntest-directory", {
          alias: [],
          default: "syntest",
          description: "The path where everything should be saved",
          group: OptionGroups.Storage,
          hidden: false,
          normalize: true,
          type: "string",
        })
        .options("temp-syntest-directory", {
          alias: [],
          default: ".syntest",
          description: "The path where all temporary files should be saved",
          group: OptionGroups.Storage,
          hidden: false,
          normalize: true,
          type: "string",
        })
    );
  }
}
