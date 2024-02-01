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

import { LogSeverity, SynTestLogLevels } from "@syntest/logging";
import * as yargs from "yargs";

export enum OptionGroups {
  General = "General Options:",
  Logging = "Logging Options:",
  Metric = "Metric Options:",
  Module = "Module Options:",
  Prng = "PRNG Options:",
  Storage = "Storage Options:",
}

export type GeneralConfig = {
  ci: boolean;
  config: string;
  fid: string;
  silent: boolean;
  verbose: number;
  quiet: boolean;
};

export const GeneralOptions: Record<string, yargs.Options> = {
  ci: {
    default: false,
    description: "Enable CI mode",
    group: OptionGroups.General,
    type: "boolean",
  },
  config: {
    alias: ["c"],
    description: "Path to the configuration file",
    group: OptionGroups.General,
    normalize: true,
    type: "string",
  },
  fid: {
    defaultDescription:
      "The default flow identifier is generated automatically",
    description: "The syntest flow identifier",
    group: OptionGroups.General,
    hidden: true,
    type: "string",
  },
  silent: {
    alias: ["s"],
    default: false,
    description: "Silence all output",
    group: OptionGroups.General,
    type: "boolean",
  },
  verbose: {
    alias: ["v"],
    count: true,
    default: 0,
    defaultDescription: "The default verbosity level (0) is warning",
    description: "Increase verbosity level (0-3)",
    group: OptionGroups.General,
    type: "number",
  },
  quiet: {
    alias: ["q"],
    default: false,
    description: "Silence all output except errors",
    group: OptionGroups.General,
    type: "boolean",
  },
};

export type LoggingConfig = {
  logDirectory: string;
  fileLogLevel: LogSeverity[];
};

export const LoggingOptions: Record<string, yargs.Options> = {
  "log-directory": {
    default: "logs",
    description:
      "The path where the log files should be saved relative to the session flow directory",
    group: OptionGroups.Logging,
    normalize: true,
    type: "string",
  },
  "file-log-level": {
    array: true,
    choices: Object.keys(SynTestLogLevels.levels),
    default: ["error", "warn", "info"],
    description: "The log levels that should be written to file",
    group: OptionGroups.Logging,
    type: "string",
  },
};

export type MetricConfig = {
  metricMiddlewarePipeline: string[];
  outputMetrics: string[];
};

export const MetricOptions: Record<string, yargs.Options> = {
  "metric-middleware-pipeline": {
    array: true,
    default: [],
    description: "The metric middleware pipeline",
    group: OptionGroups.Metric,
    type: "string",
  },
  "output-metrics": {
    array: true,
    default: [],
    description: "The metrics that should be outputted",
    group: OptionGroups.Metric,
    type: "string",
  },
};

export type ModuleConfig = {
  modules: string[];
  preset: string;
};

export const ModuleOptions: Record<string, yargs.Options> = {
  modules: {
    alias: ["m"],
    array: true,
    default: [],
    description: "List of dependencies or paths to modules to load",
    group: OptionGroups.Module,
    type: "string",
  },
  preset: {
    alias: ["p"],
    default: "none",
    description: "The preset to use",
    group: OptionGroups.Module,
    type: "string",
  },
};

export type PrngConfig = {
  randomSeed: string;
};

export const PrngOptions: Record<string, yargs.Options> = {
  "random-seed": {
    alias: ["s"],
    defaultDescription: "The default seed is generated automatically",
    description: "The seed for the pseudo random number generator",
    group: OptionGroups.Prng,
    type: "string",
  },
};

export type StorageConfig = {
  syntestDirectory: string;
  syntestTempDirectory: string;
};

export const StorageOptions: Record<string, yargs.Options> = {
  "syntest-directory": {
    default: "syntest",
    description: "The path where the session flow directory should be saved",
    group: OptionGroups.Storage,
    normalize: true,
    type: "string",
  },
  "syntest-temp-directory": {
    default: ".syntest",
    description: "The path where temporary files should be saved",
    group: OptionGroups.Storage,
    normalize: true,
    type: "string",
  },
};
