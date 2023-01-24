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

export let CONFIG: ArgumentsObject;
export class Configuration {
  initializeConfigSingleton<T extends ArgumentsObject>(argumentValues: T) {
    if (CONFIG) {
      throw Error("Already initialized the config singleton!");
    }

    CONFIG = argumentValues;
  }

  private programName: string;

  constructor(programName: string) {
    this.programName = programName;
  }

  loadConfigurationFile(cwd?: string) {
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

  processArguments<O extends OptionsObject>(
    yargs: O,
    args: string[]
  ): ArgumentsObject {
    const config = this.loadConfigurationFile();
    const configuredArgs = yargs.config(config);
    return configuredArgs.wrap(configuredArgs.terminalWidth()).parseSync(args);
  }

  configureOptions() {
    const yargs = Yargs.usage(`Usage: ${this.programName} [options]`)
      .example(
        `${this.programName} -r ./src`,
        "Running the tool with target directory 'src'"
      )
      .example(
        `${this.programName} -r ./src --population_size 10`,
        "Setting the population size"
      )
      .epilog("visit https://syntest.org for more documentation");

    const generalOptions = this.configureGeneralOptions(yargs);
    const fileOptions = this.configureFileOptions(generalOptions);
    const dirOptions = this.configureDirectoryOptions(fileOptions);
    const algorithmOptions = this.configureAlgorithmOptions(dirOptions);
    const budgetOptions = this.configureBudgetOptions(algorithmOptions);
    const loggingOptions = this.configureLoggingOptions(budgetOptions);
    const postProcessingOptions =
      this.configurePostProcessingOptions(loggingOptions);
    const samplingOptions = this.configureSamplingOptions(
      postProcessingOptions
    );
    const researchModeOptions =
      this.configureResearchModeOptions(samplingOptions);

    return researchModeOptions.showHidden(false);
  }

  configureGeneralOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // plugins
        .option("plugin", {
          alias: ["p"],
          default: [],
          description: "List of dependencies or paths to plugins to load",
          group: "General options:",
          hidden: false,
          type: "array",
        })
        // ui
        .option("user-interface", {
          alias: [],
          choices: ["regular"],
          default: "regular",
          description: "The user interface you use",
          group: "General options:",
          hidden: false,
          type: "string",
        })
    );
  }

  configureFileOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // files
        .option("target-root-directory", {
          alias: ["r"],
          demandOption: true,
          description: "The root directory where all targets are in",
          group: "File options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
        .option("include", {
          alias: ["i"],
          default: ["./src/**/*.*"],
          description: "Files/Directories to include",
          group: "File options:",
          hidden: false,
          normalize: true,
          type: "array",
        })
        .option("exclude", {
          alias: ["e"],
          default: [],
          description: "Files/Directories to exclude",
          group: "File options:",
          hidden: false,
          normalize: true,
          type: "array",
        })
    );
  }

  configureDirectoryOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // directories
        .option("statistics-directory", {
          alias: [],
          default: "syntest/statistics",
          description: "The path where the csv should be saved",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
        .option("log-directory", {
          alias: [],
          default: "syntest/logs",
          description: "The path where the logs should be saved",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
        .option("final-suite-directory", {
          alias: [],
          default: "syntest/tests",
          description: "The path where the final test suite should be saved",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
        .option("cfg-directory", {
          alias: [],
          default: "syntest/cfg",
          description: "The path where the csv should be saved",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
        .option("temp-test-directory", {
          alias: [],
          default: ".syntest/tests",
          description: "Path to the temporary test directory",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
        .option("temp-log-directory", {
          alias: [],
          default: ".syntest/logs",
          description: "Path to the temporary log directory",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
        .option("temp-instrumented-directory", {
          alias: [],
          default: ".syntest/instrumented",
          description: "Path to the temporary instrumented directory",
          group: "Directory options:",
          hidden: false,
          normalize: true,
          type: "string",
        })
    );
  }

  configureAlgorithmOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // algorithm settings
        .option("algorithm", {
          alias: ["a"],
          choices: ["Random", "NSGAII", "MOSA", "DynaMOSA", "sFuzz"],
          default: "DynaMOSA",
          description: "Algorithm to be used by the tool.",
          group: "Algorithm options:",
          hidden: false,
          type: "string",
        })
        .option("population-size", {
          alias: [],
          default: 50,
          description: "Size of the population.",
          group: "Algorithm options:",
          hidden: false,
          type: "number",
        })
    );
  }

  configureBudgetOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // time settings
        .option("time-budget", {
          alias: ["t"],
          default: 3600,
          description: "Total time budget",
          group: "Budget options:",
          hidden: false,
          type: "number",
        })
        .option("iteration-budget", {
          alias: ["b"],
          default: Number.MAX_SAFE_INTEGER,
          description: "Iteration budget",
          group: "Budget options:",
          hidden: false,
          type: "number",
        })
        .option("evaluation-budget", {
          alias: ["e"],
          default: Number.MAX_SAFE_INTEGER,
          description: "Evaluation budget",
          group: "Budget options:",
          hidden: false,
          type: "number",
        })
    );
  }

  configureLoggingOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // logging
        .option("console-log-level", {
          alias: [],
          choices: ["debug", "error", "warn", "info", "verbose", "silly"],
          default: "debug",
          description: "Log level of the tool",
          group: "Logging options:",
          hidden: false,
          type: "string",
        })
        .option("log-to-file", {
          alias: [],
          default: ["info", "warn", "error"],
          description: "Which levels should be logged to file",
          group: "Logging options:",
          hidden: false,
          type: "array",
        })
    );
  }

  configurePostProcessingOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // post processing
        .option("test-minimization", {
          alias: [],
          default: false,
          description: "Minimize test cases at the end of the search",
          group: "Postprocess options:",
          hidden: false,
          type: "boolean",
        })
    );
  }

  configureSamplingOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // random number generator settings
        .option("seed", {
          alias: ["s"],
          default: null,
          description: "Seed to be used by the pseudo random number generator.",
          group: "Sampling options:",
          hidden: false,
          type: "string",
        })
        // sampling settings
        .option("max-depth", {
          alias: [],
          default: 5,
          description: "Max depth of an individual's gene tree.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        .option("max-action-statements", {
          alias: [],
          default: 5,
          description:
            "Max number of top level action statements in an individual's gene tree.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        .option("constant-pool", {
          alias: [],
          default: false,
          description: "Enable constant pool.",
          group: "Sampling options:",
          hidden: false,
          type: "boolean",
        })
        // mutation settings
        .option("explore-illegal-values", {
          alias: [],
          default: false,
          description:
            "Allow primitives to become values outside of the specified bounds.",
          group: "Sampling options:",
          hidden: false,
          type: "boolean",
        })
        // probability settings
        .option("resample-gene-probability", {
          alias: [],
          default: 0.01,
          description: "Probability a gene gets resampled from scratch.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        .option("delta-mutation-probability", {
          alias: [],
          default: 0.8,
          description: "Probability a delta mutation is performed.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        .option("sample-existing-value-probability", {
          alias: [],
          default: 0.5,
          description:
            "Probability the return value of a function is used as argument for another function.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        .option("crossover-probability", {
          alias: [],
          default: 0.8,
          description:
            "Probability crossover happens at a certain branch point.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        .option("constant-pool-probability", {
          alias: [],
          default: 0.5,
          description:
            "Probability to sample from the constant pool instead creating random values",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        .option("sample-function-output-as-argument", {
          alias: [],
          default: 0.5,
          description:
            "Probability to sample the output of a function as an argument.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        // gene defaults
        .option("string-alphabet", {
          alias: [],
          default:
            "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
          description: "The alphabet to be used by the string gene.",
          group: "Sampling options:",
          hidden: false,
          type: "string",
        })
        .option("string-max-length", {
          alias: [],
          default: 100,
          description: "Maximal length of the string gene.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
        .option("numeric-max-value", {
          alias: [],
          default: Number.MAX_SAFE_INTEGER,
          description: "Max value used by the numeric gene.",
          group: "Sampling options:",
          hidden: false,
          type: "number",
        })
    );
  }

  configureResearchModeOptions<T>(yargs: Yargs.Argv<T>) {
    return (
      yargs
        // Research mode options
        // TODO should be moved to research mode plugin
        .option("configuration", {
          alias: [],
          default: "",
          description: "The name of the configuration.",
          group: "Research mode options:",
          hidden: false,
          type: "string",
        })
        .option("output-properties", {
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
        })
    );
  }
}

const configured = new Configuration("").configureOptions();
export type OptionsObject = typeof configured;
const parsed = configured.parseSync(["-r", "./src"]);
export type ArgumentsObject = typeof parsed;
