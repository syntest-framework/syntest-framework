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

import {
  GeneralOptions,
  StorageOptions as CliStorageOptions,
  OptionGroups as CliOptionGroups,
} from "@syntest/cli";
import { singletonAlreadySet } from "@syntest/core/lib/util/diagnostics";
import { LoggingOptions } from "@syntest/logging";
import Yargs = require("yargs");

export enum OptionGroups {
  Target = "Target Options:",
  Algorithm = "Algorithm Options:",
  Budget = "Budget Options:",
  PostProccessing = "Post Proccessing Options:",
  Sampling = "Sampling Options:",
  ResearchMode = "Research Mode Options:",
}
export type TargetOptions = {
  targetRootDirectory: string;
  include: string[];
  exclude: string[];
};

export type StorageOptions = {
  statisticsDirectory: string;
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
  CliStorageOptions &
  AlgorithmOptions &
  BudgetOptions &
  LoggingOptions &
  PostProcessingOptions &
  SamplingOptions &
  ResearchModeOptions;

export let CONFIG: Readonly<ArgumentsObject>;
export class Configuration {
  initialize<A extends ArgumentsObject>(argumentValues: Readonly<A>) {
    if (CONFIG) {
      throw new Error(singletonAlreadySet("config"));
    }

    CONFIG = argumentValues;
  }

  configureBaseOptions(yargs: Yargs.Argv) {
    yargs = this.configureTargetOptions(yargs);
    yargs = this.configureStorageOptions(yargs);
    yargs = this.configureAlgorithmOptions(yargs);
    yargs = this.configureBudgetOptions(yargs);
    yargs = this.configurePostProcessingOptions(yargs);
    yargs = this.configureSamplingOptions(yargs);
    yargs = this.configureResearchModeOptions(yargs);

    return yargs;
  }

  configureTargetOptions(yargs: Yargs.Argv) {
    return yargs.options({
      // Files
      "target-root-directory": {
        alias: ["r"],
        demandOption: true,
        description: "The root directory where all targets are in",
        group: OptionGroups.Target,
        hidden: false,
        normalize: true,
        type: "string",
      },
      include: {
        alias: ["i"],
        default: ["./src/**/*.*"],
        description: "Files/Directories to include",
        group: OptionGroups.Target,
        hidden: false,
        normalize: true,
        type: "array",
      },
      exclude: {
        alias: ["e"],
        default: [],
        description: "Files/Directories to exclude",
        group: OptionGroups.Target,
        hidden: false,
        normalize: true,
        type: "array",
      },
    });
  }

  configureStorageOptions(yargs: Yargs.Argv) {
    return yargs.options({
      // directories
      "statistics-directory": {
        alias: [],
        default: "statistics",
        description:
          "The path where the csv should be saved (within the syntest-directory)",
        group: CliOptionGroups.Storage,
        hidden: false,
        normalize: true,
        type: "string",
      },
      "test-directory": {
        alias: [],
        default: "tests",
        description:
          "The path where the final test suite should be saved (within the syntest-directory)",
        group: CliOptionGroups.Storage,
        hidden: false,
        normalize: true,
        type: "string",
      },
      "temp-test-directory": {
        alias: [],
        default: "tests",
        description:
          "Path to the temporary test directory (within the temp-syntest-directory)",
        group: CliOptionGroups.Storage,
        hidden: false,
        normalize: true,
        type: "string",
      },
      "temp-log-directory": {
        alias: [],
        default: "logs",
        description:
          "Path to the temporary log directory (within the temp-syntest-directory)",
        group: CliOptionGroups.Storage,
        hidden: false,
        normalize: true,
        type: "string",
      },
      "temp-instrumented-directory": {
        alias: [],
        default: "instrumented",
        description:
          "Path to the temporary instrumented directory (within the temp-syntest-directory)",
        group: CliOptionGroups.Storage,
        hidden: false,
        normalize: true,
        type: "string",
      },
    });
  }

  configureAlgorithmOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // algorithm settings
        .options({
          algorithm: {
            alias: ["a"],
            default: "DynaMOSA",
            description: "Algorithm to be used by the tool.",
            group: OptionGroups.Algorithm,
            hidden: false,
            type: "string",
          },
          "population-size": {
            alias: [],
            default: 50,
            description: "Size of the population.",
            group: OptionGroups.Algorithm,
            hidden: false,
            type: "number",
          },
          crossover: {
            alias: [],
            default: "",
            description: "Crossover operator to be used by the tool.",
            group: OptionGroups.Algorithm,
            hidden: false,
            type: "string",
          },
          sampler: {
            alias: [],
            default: "random",
            description: "Sampler to be used by the tool.",
            group: OptionGroups.Algorithm,
            hidden: false,
            type: "string",
          },
          "termination-triggers": {
            alias: [],
            default: ["signal"],

            description: "Termination trigger to be used by the tool.",
            group: OptionGroups.Algorithm,
            hidden: false,
            type: "string",
          },
        })
    );
  }

  configureBudgetOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // time settings
        .options({
          "total-time-budget": {
            alias: ["t"],
            default: 3600,
            description: "Total time budget",
            group: OptionGroups.Budget,
            hidden: false,
            type: "number",
          },
          "search-time-budget": {
            alias: [],
            default: 3600,
            description: "Search time budget",
            group: OptionGroups.Budget,
            hidden: false,
            type: "number",
          },
          "iteration-budget": {
            alias: ["b"],
            default: Number.MAX_SAFE_INTEGER,
            description: "Iteration budget",
            group: OptionGroups.Budget,
            hidden: false,
            type: "number",
          },
          "evaluation-budget": {
            alias: [],
            default: Number.MAX_SAFE_INTEGER,
            description: "Evaluation budget",
            group: OptionGroups.Budget,
            hidden: false,
            type: "number",
          },
        })
    );
  }

  configurePostProcessingOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // post processing
        .options({
          "test-minimization": {
            alias: [],
            default: false,
            description: "Minimize test cases at the end of the search",
            group: OptionGroups.PostProccessing,
            hidden: false,
            type: "boolean",
          },
        })
    );
  }

  configureSamplingOptions(yargs: Yargs.Argv) {
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
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          "max-action-statements": {
            alias: [],
            default: 5,
            description:
              "Max number of top level action statements in an individual's gene tree.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          "constant-pool": {
            alias: [],
            default: false,
            description: "Enable constant pool.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "boolean",
          },
          // mutation settings
          "explore-illegal-values": {
            alias: [],
            default: false,
            description:
              "Allow primitives to become values outside of the specified bounds.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "boolean",
          },
          // probability settings
          "resample-gene-probability": {
            alias: [],
            default: 0.01,
            description: "Probability a gene gets resampled from scratch.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          "delta-mutation-probability": {
            alias: [],
            default: 0.8,
            description: "Probability a delta mutation is performed.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          "sample-existing-value-probability": {
            alias: [],
            default: 0.5,
            description:
              "Probability the return value of a function is used as argument for another function.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          "crossover-probability": {
            alias: [],
            default: 0.8,
            description:
              "Probability crossover happens at a certain branch point.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          "constant-pool-probability": {
            alias: [],
            default: 0.5,
            description:
              "Probability to sample from the constant pool instead creating random values",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          "sample-function-output-as-argument": {
            alias: [],
            default: 0.5,
            description:
              "Probability to sample the output of a function as an argument.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          // gene defaults
          "string-alphabet": {
            alias: [],
            default:
              "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
            description: "The alphabet to be used by the string gene.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "string",
          },
          "string-max-length": {
            alias: [],
            default: 100,
            description: "Maximal length of the string gene.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
          "numeric-max-value": {
            alias: [],
            default: Number.MAX_SAFE_INTEGER,
            description: "Max value used by the numeric gene.",
            group: OptionGroups.Sampling,
            hidden: false,
            type: "number",
          },
        })
    );
  }

  configureResearchModeOptions(yargs: Yargs.Argv) {
    return (
      yargs
        // Research mode options
        // TODO should be moved to research mode plugin
        .options({
          configuration: {
            alias: [],
            default: "",
            description: "The name of the configuration.",
            group: OptionGroups.ResearchMode,
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
            group: OptionGroups.ResearchMode,
            hidden: false,
            type: "array",
          },
        })
    );
  }
}
