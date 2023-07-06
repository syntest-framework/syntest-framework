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

import { LoggingOptions } from "@syntest/logging";
import { PresetOptions } from "@syntest/module";
import { PrngOptions } from "@syntest/prng";
import { StorageOptions as ModuleStorageOptions } from "@syntest/storage";
import Yargs = require("yargs");

export enum OptionGroups {
  Storage = "Storage Options:",
  Target = "Target Options:",
  SearchAlgorithm = "Search Algorithm Options:",
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
  instrumentedDirectory: string;
};

export type AlgorithmOptions = {
  searchAlgorithm: string;
  populationSize: number;
  objectiveManager: string;
  secondaryObjectives: string[];
  procreation: string;
  crossover: string;
  sampler: string;
  terminationTriggers: string[];
};

export type BudgetOptions = {
  totalTime: number;
  searchTime: number;
  iterations: number;
  evaluations: number;
};

export type PostProcessingOptions = {
  testMinimization: boolean;
};

export type SamplingOptions = {
  maxDepth: number;
  maxActionStatements: number;
  constantPool: boolean;
  exploreIllegalValues: boolean;
  resampleGeneProbability: number;
  deltaMutationProbability: number;
  sampleExistingValueProbability: number;
  multiPointCrossoverProbability: number;
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

export type ArgumentsObject = PresetOptions &
  TargetOptions &
  StorageOptions &
  ModuleStorageOptions &
  AlgorithmOptions &
  BudgetOptions &
  LoggingOptions &
  PostProcessingOptions &
  SamplingOptions &
  ResearchModeOptions &
  PrngOptions;

export class Configuration {
  getOptions(): { [key: string]: Yargs.Options } {
    return {
      ...this.getTargetOptions(),
      ...this.getStorageOptions(),
      ...this.getAlgorithmOptions(),
      ...this.getBudgetOptions(),
      ...this.getPostProcessingOptions(),
      ...this.getSamplingOptions(),
      ...this.getResearchModeOptions(),
    };
  }

  getTargetOptions(): { [key: string]: Yargs.Options } {
    return {
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
    };
  }

  getStorageOptions(): { [key: string]: Yargs.Options } {
    return {
      // directories
      "statistics-directory": {
        alias: [],
        default: "statistics",
        description:
          "The path where the csv should be saved (within the syntest-directory)",
        group: OptionGroups.Storage,
        hidden: false,
        normalize: true,
        type: "string",
      },
      "test-directory": {
        alias: [],
        default: "tests",
        description:
          "The path where the final test suite should be saved (within the syntest-directory)",
        group: OptionGroups.Storage,
        hidden: false,
        normalize: true,
        type: "string",
      },
      "instrumented-directory": {
        alias: [],
        default: "instrumented",
        description:
          "Path to the temporary instrumented directory (within the temp-syntest-directory)",
        group: OptionGroups.Storage,
        hidden: false,
        normalize: true,
        type: "string",
      },
    };
  }

  getAlgorithmOptions(): { [key: string]: Yargs.Options } {
    return {
      "search-algorithm": {
        alias: ["a"],
        choices: [],
        description: "Search algorithm to be used by the tool.",
        group: OptionGroups.SearchAlgorithm,
        hidden: false,
        type: "string",
      },
      "population-size": {
        alias: [],
        default: 50,
        description: "Size of the population.",
        group: OptionGroups.SearchAlgorithm,
        hidden: false,
        type: "number",
      },
      "objective-manager": {
        alias: [],
        choices: [],
        description: "Objective manager to be used by the tool.",
        group: OptionGroups.SearchAlgorithm,
        hidden: false,
        type: "string",
      },
      "secondary-objectives": {
        alias: [],
        default: [],
        choices: [],
        description: "Secondary objectives to be used by the tool.",
        group: OptionGroups.SearchAlgorithm,
        hidden: false,
        type: "string",
      },
      crossover: {
        alias: [],
        choices: [],
        description: "Crossover operator to be used by the tool.",
        group: OptionGroups.SearchAlgorithm,
        hidden: false,
        type: "string",
      },
      procreation: {
        alias: [],
        choices: [],
        description: "Procreation operator to be used by the tool.",
        group: OptionGroups.SearchAlgorithm,
        hidden: false,
        type: "string",
      },
      sampler: {
        alias: [],
        choices: [],
        description: "Sampler to be used by the tool.",
        group: OptionGroups.SearchAlgorithm,
        hidden: false,
        type: "string",
      },
      "termination-triggers": {
        alias: [],
        default: ["signal"],
        choices: [],
        description: "Termination trigger to be used by the tool.",
        group: OptionGroups.SearchAlgorithm,
        hidden: false,
        type: "array",
      },
    };
  }

  getBudgetOptions(): { [key: string]: Yargs.Options } {
    return {
      "total-time": {
        alias: ["t"],
        default: Number.MAX_SAFE_INTEGER,
        description: "Total time budget in seconds",
        group: OptionGroups.Budget,
        hidden: false,
        type: "number",
      },
      "search-time": {
        alias: [],
        default: Number.MAX_SAFE_INTEGER,
        description: "Search time budget in seconds",
        group: OptionGroups.Budget,
        hidden: false,
        type: "number",
      },
      iterations: {
        alias: [],
        default: Number.MAX_SAFE_INTEGER,
        description: "Iteration budget",
        group: OptionGroups.Budget,
        hidden: false,
        type: "number",
      },
      evaluations: {
        alias: [],
        default: Number.MAX_SAFE_INTEGER,
        description: "Evaluation budget",
        group: OptionGroups.Budget,
        hidden: false,
        type: "number",
      },
    };
  }

  getPostProcessingOptions(): { [key: string]: Yargs.Options } {
    return {
      "test-minimization": {
        alias: [],
        default: false,
        description: "Minimize test cases at the end of the search",
        group: OptionGroups.PostProccessing,
        hidden: false,
        type: "boolean",
      },
    };
  }

  getSamplingOptions(): { [key: string]: Yargs.Options } {
    return {
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
        default: 0.7,
        description: "Probability crossover happens for a certain encoding.",
        group: OptionGroups.Sampling,
        hidden: false,
        type: "number",
      },
      "multi-point-crossover-probability": {
        alias: [],
        default: 0.5,
        description: "Probability crossover happens at a certain branch point.",
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
    };
  }

  getResearchModeOptions(): { [key: string]: Yargs.Options } {
    return {
      configuration: {
        alias: [],
        default: "",
        description: "The name of the configuration.",
        group: OptionGroups.ResearchMode,
        hidden: false,
        type: "string",
      },
    };
  }
}
