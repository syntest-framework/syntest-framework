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
import * as path from "path";
import shell = require("shelljs");

export type GeneralOptions = {
  plugins: string[];
  userInterface: string;
};

export type TargetOptions = {
  targetRootDirectory: string;
  include: string[];
  exclude: string[];
};

export type StorageOptions = {
  statisticsDirectory: string;
  logDirectory: string;
  testDirectory: string;
  tempLogDirectory: string;
  tempTestDirectory: string;
  tempInstrumentedDirectory: string;
};

export type AlgorithmOptions = {
  algorithm: string;
  populationSize: number;
  crossover: string;
  sampler: string;
  terminationTriggers: string[];
};

export type BudgetOptions = {
  totalTimeBudget: number;
  searchTimeBudget: number;
  iterationBudget: number;
  evaluationBudget: number;
};

export type LoggingOptions = {
  consoleLogLevel: string;
  logToFile: string[];
};

export type PostProcessingOptions = {
  testMinimization: boolean;
};

export type SamplingOptions = {
  seed: string;
  maxDepth: number;
  maxActionStatements: number;
  constantPool: boolean;
  exploreIllegalValues: boolean;
  resampleGeneProbability: number;
  deltaMutationProbability: number;
  sampleExistingValueProbability: number;
  crossoverProbability: number;
  constantPoolProbability: number;
  sampleFunctionOutputAsArgument: number;
  stringAlphabet: string;
  stringMaxLength: number;
  numericMaxValue: number;
};

export type ResearchModeOptions = {
  configuration: string;
  outputProperties: string[];
};

export type ArgumentsObject = GeneralOptions &
  TargetOptions &
  StorageOptions &
  AlgorithmOptions &
  BudgetOptions &
  LoggingOptions &
  PostProcessingOptions &
  SamplingOptions &
  ResearchModeOptions;

export let CONFIG: Readonly<ArgumentsObject>;
export class Configuration {
  static initialize<A extends ArgumentsObject>(argumentValues: Readonly<A>) {
    if (CONFIG) {
      throw Error("Already initialized the config singleton!");
    }

    CONFIG = argumentValues;
  }

  static loadFile(cwd?: string) {
    cwd = cwd || process.env.SYNTEST_CWD || process.cwd();
    const configPath = path.join(cwd, ".syntest.js");
    let config;
    // Catch syntestjs syntax errors
    if (shell.test("-e", configPath)) {
      try {
        config = require(configPath);
      } catch (error) {
        throw new Error(error);
      }
      // Config is optional
    } else {
      config = {};
    }

    return config;
  }

  static processArguments(yargs: Yargs.Argv, args: string[]): ArgumentsObject {
    const config = Configuration.loadFile();
    const configuredArgs = yargs.config(config);
    return <ArgumentsObject>(
      (<unknown>(
        configuredArgs.wrap(configuredArgs.terminalWidth()).parseSync(args)
      ))
    );
  }

  static configureUsage(programName: string) {
    return Yargs.usage(`Usage: ${programName} <command> [options]`)
      .example(
        `${programName} run -r ./src`,
        "Running the tool with target directory 'src'"
      )
      .example(
        `${programName} run -r ./src --population_size 10`,
        "Setting the population size"
      )
      .epilog("visit https://syntest.org for more documentation");
  }

  static configureCommands(yargs: Yargs.Argv, additionalCommandsDir?: string) {
    yargs = yargs.commandDir("./commands");

    if (additionalCommandsDir) {
      yargs = yargs.commandDir(additionalCommandsDir);
    }

    return yargs.demandCommand();
  }

  static configureBaseOptions(yargs: Yargs.Argv) {
    yargs = Configuration.configureGeneralOptions(yargs);
    yargs = Configuration.configureTargetOptions(yargs);
    yargs = Configuration.configureStorageOptions(yargs);
    yargs = Configuration.configureAlgorithmOptions(yargs);
    yargs = Configuration.configureBudgetOptions(yargs);
    yargs = Configuration.configureLoggingOptions(yargs);
    yargs = Configuration.configurePostProcessingOptions(yargs);
    yargs = Configuration.configureSamplingOptions(yargs);
    yargs = Configuration.configureResearchModeOptions(yargs);

    return yargs;
  }

  static configureGeneralOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // plugins
        .option("plugins", {
          alias: ["p"],
          array: true,
          default: [],
          description: "List of dependencies or paths to plugins to load",
          group: "General options:",
          hidden: false,
          type: "string",
        })
        // ui
        .option("user-interface", {
          alias: [],
          default: "regular",
          description: "The user interface you use",
          group: "General options:",
          hidden: false,
          type: "string",
        })
    );
  }

  static configureTargetOptions(yargs: Yargs.Argv) {
    return yargs.options({
      // Files
      "target-root-directory": {
        alias: ["r"],
        demandOption: true,
        description: "The root directory where all targets are in",
        group: "File options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
      include: {
        alias: ["i"],
        default: ["./src/**/*.*"],
        description: "Files/Directories to include",
        group: "File options:",
        hidden: false,
        normalize: true,
        type: "array",
      },
      exclude: {
        alias: ["e"],
        default: [],
        description: "Files/Directories to exclude",
        group: "File options:",
        hidden: false,
        normalize: true,
        type: "array",
      },
    });
  }

  static configureStorageOptions(yargs: Yargs.Argv) {
    return yargs.options({
      // directories
      "statistics-directory": {
        alias: [],
        default: "syntest/statistics",
        description: "The path where the csv should be saved",
        group: "Directory options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
      "log-directory": {
        alias: [],
        default: "syntest/logs",
        description: "The path where the logs should be saved",
        group: "Directory options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
      "test-directory": {
        alias: [],
        default: "syntest/tests",
        description: "The path where the final test suite should be saved",
        group: "Directory options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
      "temp-log-directory": {
        alias: [],
        default: ".syntest/logs",
        description: "Path to the temporary log directory",
        group: "Directory options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
      "temp-test-directory": {
        alias: [],
        default: ".syntest/tests",
        description: "Path to the temporary test directory",
        group: "Directory options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
      "temp-instrumented-directory": {
        alias: [],
        default: ".syntest/instrumented",
        description: "Path to the temporary instrumented directory",
        group: "Directory options:",
        hidden: false,
        normalize: true,
        type: "string",
      },
    });
  }

  static configureAlgorithmOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // algorithm settings
        .options({
          algorithm: {
            alias: ["a"],
            default: "DynaMOSA",
            description: "Algorithm to be used by the tool.",
            group: "Algorithm options:",
            hidden: false,
            type: "string",
          },
          "population-size": {
            alias: [],
            default: 50,
            description: "Size of the population.",
            group: "Algorithm options:",
            hidden: false,
            type: "number",
          },
          crossover: {
            alias: [],
            default: "",
            description: "Crossover operator to be used by the tool.",
            group: "Algorithm options:",
            hidden: false,
            type: "string",
          },
          sampler: {
            alias: [],
            default: "random",
            description: "Sampler to be used by the tool.",
            group: "Algorithm options:",
            hidden: false,
            type: "string",
          },
          "termination-triggers": {
            alias: [],
            default: ["signal"],

            description: "Termination trigger to be used by the tool.",
            group: "Algorithm options:",
            hidden: false,
            type: "string",
          },
        })
    );
  }

  static configureBudgetOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // time settings
        .options({
          "total-time-budget": {
            alias: ["t"],
            default: 3600,
            description: "Total time budget",
            group: "Budget options:",
            hidden: false,
            type: "number",
          },
          "search-time-budget": {
            alias: [],
            default: 3600,
            description: "Search time budget",
            group: "Budget options:",
            hidden: false,
            type: "number",
          },
          "iteration-budget": {
            alias: ["b"],
            default: Number.MAX_SAFE_INTEGER,
            description: "Iteration budget",
            group: "Budget options:",
            hidden: false,
            type: "number",
          },
          "evaluation-budget": {
            alias: [],
            default: Number.MAX_SAFE_INTEGER,
            description: "Evaluation budget",
            group: "Budget options:",
            hidden: false,
            type: "number",
          },
        })
    );
  }

  static configureLoggingOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // logging
        .options({
          "console-log-level": {
            alias: [],
            choices: ["debug", "error", "warn", "info", "verbose", "silly"],
            default: "debug",
            description: "Log level of the tool",
            group: "Logging options:",
            hidden: false,
            type: "string",
          },
          "log-to-file": {
            alias: [],
            default: ["info", "warn", "error"],
            description: "Which levels should be logged to file",
            group: "Logging options:",
            hidden: false,
            type: "array",
          },
        })
    );
  }

  static configurePostProcessingOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // post processing
        .options({
          "test-minimization": {
            alias: [],
            default: false,
            description: "Minimize test cases at the end of the search",
            group: "Postprocess options:",
            hidden: false,
            type: "boolean",
          },
        })
    );
  }

  static configureSamplingOptions(yargs: Yargs.Argv): Yargs.Argv {
    return (
      yargs
        // random number generator settings
        .options({
          seed: {
            alias: ["s"],
            default: null,
            description:
              "Seed to be used by the pseudo random number generator.",
            group: "Sampling options:",
            hidden: false,
            type: "string",
          },
          // sampling settings
          "max-depth": {
            alias: [],
            default: 5,
            description: "Max depth of an individual's gene tree.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          "max-action-statements": {
            alias: [],
            default: 5,
            description:
              "Max number of top level action statements in an individual's gene tree.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          "constant-pool": {
            alias: [],
            default: false,
            description: "Enable constant pool.",
            group: "Sampling options:",
            hidden: false,
            type: "boolean",
          },
          // mutation settings
          "explore-illegal-values": {
            alias: [],
            default: false,
            description:
              "Allow primitives to become values outside of the specified bounds.",
            group: "Sampling options:",
            hidden: false,
            type: "boolean",
          },
          // probability settings
          "resample-gene-probability": {
            alias: [],
            default: 0.01,
            description: "Probability a gene gets resampled from scratch.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          "delta-mutation-probability": {
            alias: [],
            default: 0.8,
            description: "Probability a delta mutation is performed.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          "sample-existing-value-probability": {
            alias: [],
            default: 0.5,
            description:
              "Probability the return value of a function is used as argument for another function.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          "crossover-probability": {
            alias: [],
            default: 0.8,
            description:
              "Probability crossover happens at a certain branch point.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          "constant-pool-probability": {
            alias: [],
            default: 0.5,
            description:
              "Probability to sample from the constant pool instead creating random values",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          "sample-function-output-as-argument": {
            alias: [],
            default: 0.5,
            description:
              "Probability to sample the output of a function as an argument.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          // gene defaults
          "string-alphabet": {
            alias: [],
            default:
              "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
            description: "The alphabet to be used by the string gene.",
            group: "Sampling options:",
            hidden: false,
            type: "string",
          },
          "string-max-length": {
            alias: [],
            default: 100,
            description: "Maximal length of the string gene.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
          "numeric-max-value": {
            alias: [],
            default: Number.MAX_SAFE_INTEGER,
            description: "Max value used by the numeric gene.",
            group: "Sampling options:",
            hidden: false,
            type: "number",
          },
        })
    );
  }

  static configureResearchModeOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // Research mode options
        // TODO should be moved to research mode plugin
        .options({
          configuration: {
            alias: [],
            default: "",
            description: "The name of the configuration.",
            group: "Research mode options:",
            hidden: false,
            type: "string",
          },
          "output-properties": {
            alias: [],
            default: [
              "timestamp",
              "targetName",
              "coveredBranches",
              "totalBranches",
              "fitnessEvaluations",
            ],
            description: "The values that should be written to csv",
            group: "Research mode options:",
            hidden: false,
            type: "array",
          },
        })
    );
  }
}
