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
import { LoggingOptions } from "@syntest/logging";
import yargs = require("yargs");

export type BaseOptions = PresetOptions & LoggingOptions & ModuleOptions;

export enum OptionGroups {
  General = "General Options:",
  Module = "Module Options:",
}

export type PresetOptions = {
  preset: string;
};

export type ModuleOptions = {
  modules: string[];
};

export const Configuration = {
  configureOptions(yargs: yargs.Argv) {
    return yargs
      .option("preset", {
        alias: ["p"],
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
