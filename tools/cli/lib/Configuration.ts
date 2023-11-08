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

import * as yargs from "yargs";

export enum OptionGroups {
  General = "General Options:",
}

export type ConfigOptions = {
  config: string;
  verbose: number;
};

export const Configuration = {
  configureOptions(yargs: yargs.Argv) {
    return yargs
      .option("config", {
        alias: ["c"],
        config: true,
        default: ".syntest.json",
        description: "Manually specify path to config file",
        group: OptionGroups.General,
        hidden: false,
        type: "string",
      })
      .option("verbose", {
        alias: ["v"],
        count: true,
        default: 0,
        description: "Increase verbosity of output",
        group: OptionGroups.General,
        hidden: false,
        type: "boolean",
      });
  },
};
