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
import { ModuleOptions } from "@syntest/module";

export type GeneralOptions = {
  config: string;
  preset: string;
};

export type StorageOptions = {
  syntestDirectory: string;
  tempSyntestDirectory: string;
};

export type BaseOptions = GeneralOptions &
  StorageOptions &
  LoggingOptions &
  ModuleOptions;

export enum OptionGroups {
  General = "General Options:",
  Storage = "Storage Options:",
}

export class Configuration {
  static configureUsage() {
    return (
      Yargs.usage(`Usage: syntest <tool> <command> [options]`)
        // TODO examples
        .epilog("visit https://syntest.org for more documentation")
    );
  }

  static configureOptions(yargs: Yargs.Argv) {
    return (
      yargs
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
          choices: ["none"],
          default: "none",
          description: "The preset you want to use",
          group: OptionGroups.General,
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
