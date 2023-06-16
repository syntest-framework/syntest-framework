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
import { Metric, MetricType, SeriesType } from "@syntest/metric";

export enum SeriesName {
  BRANCHES_COVERED = "branches-covered",
  STATEMENTS_COVERED = "statements-covered",
  FUNCTIONS_COVERED = "functions-covered",

  PATH_OBJECTIVES_COVERED = "path-objectives-covered",
  BRANCH_OBJECTIVES_COVERED = "branch-objectives-covered",
  EXCEPTION_OBJECTIVES_COVERED = "exception-objectives-covered",
  FUNCTION_OBJECTIVES_COVERED = "function-objectives-covered",
  LINE_OBJECTIVES_COVERED = "line-objectives-covered",
  IMPLICIT_BRANCH_OBJECTIVES_COVERED = "implicit-branch-objectives-covered",
  OBJECTIVES_COVERED = "objectives-covered",

  ARCHIVE_SIZE = "archive-size",
}

export enum PropertyName {
  BRANCHES_COVERED = "branches-covered",
  STATEMENTS_COVERED = "statements-covered",
  FUNCTIONS_COVERED = "functions-covered",

  BRANCHES_TOTAL = "branches-total",
  STATEMENTS_TOTAL = "statements-total",
  FUNCTIONS_TOTAL = "functions-total",

  PATH_OBJECTIVES_COVERED = "path-objectives-covered",
  BRANCH_OBJECTIVES_COVERED = "branch-objectives-covered",
  EXCEPTION_OBJECTIVES_COVERED = "exception-objectives-covered",
  FUNCTION_OBJECTIVES_COVERED = "function-objectives-covered",
  LINE_OBJECTIVES_COVERED = "line-objectives-covered",
  IMPLICIT_BRANCH_OBJECTIVES_COVERED = "implicit-branch-objectives-covered",
  OBJECTIVES_COVERED = "objectives-covered",

  PATH_OBJECTIVES_TOTAL = "path-objectives-total",
  BRANCH_OBJECTIVES_TOTAL = "branch-objectives-total",
  EXCEPTION_OBJECTIVES_TOTAL = "exception-objectives-total",
  FUNCTION_OBJECTIVES_TOTAL = "function-objectives-total",
  LINE_OBJECTIVES_TOTAL = "line-objectives-total",
  IMPLICIT_BRANCH_OBJECTIVES_TOTAL = "implicit-branch-objectives-total",
  OBJECTIVES_TOTAL = "objectives-total",

  // config settings
  TARGET_ROOT_DIRECTORY = "target-root-directory",
  INCLUDE = "include",
  EXCLUDE = "exclude",

  SEARCH_ALGORITHM = "search-algorithm",
  POPULATION_SIZE = "population-size",
  OBJECTIVE_MANAGER = "objective-manager",
  SECONDARY_OBJECTIVES = "secondary-objectives",
  PROCREATION = "procreation",
  CROSSOVER = "crossover",
  SAMPLER = "sampler",
  TERMINATION_TRIGGERS = "termination-triggers",

  MAX_TOTAL_TIME = "max-total-time",
  MAX_SEARCH_TIME = "max-search-time",
  MAX_EVALUATIONS = "max-evaluations",
  MAX_ITERATIONS = "max-iterations",

  TEST_MINIMIZATION = "test-minimization",

  RANDOM_SEED = "random-seed",
  MAX_DEPTH = "max-depth",
  MAX_ACTION_STATEMENTS = "max-action-statements",
  CONSTANT_POOL_ENABLED = "constant-pool-enabled",
  EXPLORE_ILLEGAL_VALUES = "explore-illegal-values",
  RESAMPLE_GENE_PROBABILITY = "resample-gene-probability",
  DELTA_MUTATION_PROBABILITY = "delta-mutation-probability",
  SAMPLE_EXISTING_VALUE_PROBABILITY = "sample-existing-value-probability",
  MULTI_POINT_CROSSOVER_PROBABILITY = "multi-point-crossover-probability",
  CROSSOVER_PROBABILITY = "crossover-probability",
  CONSTANT_POOL_PROBABILITY = "constant-pool-probability",
  SAMPLE_FUNCTION_OUTPUT_AS_ARGUMENT = "sample-function-output-as-argument",
  STRING_ALPHABET = "string-alphabet",
  STRING_MAX_LENGTH = "string-max-length",
  NUMERIC_MAX_VALUE = "numeric-max-value",

  CONFIGURATION = "configuration",

  // timing and iterations/evaluations
  TOTAL_TIME = "total-time",
  SEARCH_TIME = "search-time",
  EVALUATIONS = "evaluations",
  ITERATIONS = "iterations",

  INITIALIZATION_TIME = "initialization-time",
  PREPROCESS_TIME = "pre-process-time",
  PROCESS_TIME = "process-time",
  POSTPROCESS_TIME = "post-process-time",

  TARGET_LOAD_TIME = "target-load-time",
  INSTRUMENTATION_TIME = "instrumentation-time",
  TYPE_RESOLVE_TIME = "type-resolve-time",

  // other results
  ARCHIVE_SIZE = "archive-size",
  MINIMIZED_ARCHIVE_SIZE = "minimized-archive-size",
}

export const metrics: Metric[] = [
  // coverage
  // search time
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.STATEMENTS_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.BRANCHES_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.FUNCTIONS_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },

  {
    type: MetricType.SERIES,
    seriesName: SeriesName.PATH_OBJECTIVES_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.BRANCH_OBJECTIVES_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.EXCEPTION_OBJECTIVES_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.FUNCTION_OBJECTIVES_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.LINE_OBJECTIVES_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.IMPLICIT_BRANCH_OBJECTIVES_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.OBJECTIVES_COVERED,
    seriesType: SeriesType.SEARCH_TIME,
  },

  // total time
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.STATEMENTS_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.BRANCHES_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.FUNCTIONS_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },

  {
    type: MetricType.SERIES,
    seriesName: SeriesName.PATH_OBJECTIVES_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.BRANCH_OBJECTIVES_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.EXCEPTION_OBJECTIVES_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.FUNCTION_OBJECTIVES_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.LINE_OBJECTIVES_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.IMPLICIT_BRANCH_OBJECTIVES_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.OBJECTIVES_COVERED,
    seriesType: SeriesType.TOTAL_TIME,
  },

  // iterations
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.STATEMENTS_COVERED,
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.BRANCHES_COVERED,
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.FUNCTIONS_COVERED,
    seriesType: SeriesType.ITERATION,
  },

  {
    type: MetricType.SERIES,
    seriesName: SeriesName.PATH_OBJECTIVES_COVERED,
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.BRANCH_OBJECTIVES_COVERED,
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.EXCEPTION_OBJECTIVES_COVERED,
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.FUNCTION_OBJECTIVES_COVERED,
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.LINE_OBJECTIVES_COVERED,
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.IMPLICIT_BRANCH_OBJECTIVES_COVERED,
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.OBJECTIVES_COVERED,
    seriesType: SeriesType.ITERATION,
  },

  // evaluations
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.STATEMENTS_COVERED,
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.BRANCHES_COVERED,
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.FUNCTIONS_COVERED,
    seriesType: SeriesType.EVALUATION,
  },

  {
    type: MetricType.SERIES,
    seriesName: SeriesName.PATH_OBJECTIVES_COVERED,
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.BRANCH_OBJECTIVES_COVERED,
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.EXCEPTION_OBJECTIVES_COVERED,
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.FUNCTION_OBJECTIVES_COVERED,
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.LINE_OBJECTIVES_COVERED,
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.IMPLICIT_BRANCH_OBJECTIVES_COVERED,
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.OBJECTIVES_COVERED,
    seriesType: SeriesType.EVALUATION,
  },

  // totals
  {
    type: MetricType.PROPERTY,
    property: PropertyName.STATEMENTS_TOTAL,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.BRANCHES_TOTAL,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.FUNCTIONS_TOTAL,
  },

  {
    type: MetricType.PROPERTY,
    property: PropertyName.PATH_OBJECTIVES_TOTAL,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.BRANCH_OBJECTIVES_TOTAL,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.FUNCTION_OBJECTIVES_TOTAL,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.EXCEPTION_OBJECTIVES_TOTAL,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.LINE_OBJECTIVES_TOTAL,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.IMPLICIT_BRANCH_OBJECTIVES_TOTAL,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.OBJECTIVES_TOTAL,
  },

  // final coverage
  {
    type: MetricType.PROPERTY,
    property: PropertyName.STATEMENTS_COVERED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.BRANCHES_COVERED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.FUNCTIONS_COVERED,
  },

  {
    type: MetricType.PROPERTY,
    property: PropertyName.PATH_OBJECTIVES_COVERED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.BRANCH_OBJECTIVES_COVERED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.FUNCTION_OBJECTIVES_COVERED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.EXCEPTION_OBJECTIVES_COVERED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.LINE_OBJECTIVES_COVERED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.IMPLICIT_BRANCH_OBJECTIVES_COVERED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.OBJECTIVES_COVERED,
  },

  // general properties
  {
    type: MetricType.PROPERTY,
    property: PropertyName.TARGET_ROOT_DIRECTORY,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.INCLUDE,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.EXCLUDE,
  },

  // search
  {
    type: MetricType.PROPERTY,
    property: PropertyName.SEARCH_ALGORITHM,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.POPULATION_SIZE,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.OBJECTIVE_MANAGER,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.SECONDARY_OBJECTIVES,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.PROCREATION,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.CROSSOVER,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.SAMPLER,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.TERMINATION_TRIGGERS,
  },

  // timing
  {
    type: MetricType.PROPERTY,
    property: PropertyName.MAX_TOTAL_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.MAX_SEARCH_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.MAX_EVALUATIONS,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.MAX_ITERATIONS,
  },
  // postprocess
  {
    type: MetricType.PROPERTY,
    property: PropertyName.TEST_MINIMIZATION,
  },
  // sampling
  {
    type: MetricType.PROPERTY,
    property: PropertyName.RANDOM_SEED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.MAX_DEPTH,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.MAX_ACTION_STATEMENTS,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.CONSTANT_POOL_ENABLED,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.EXPLORE_ILLEGAL_VALUES,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.RESAMPLE_GENE_PROBABILITY,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.DELTA_MUTATION_PROBABILITY,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.SAMPLE_EXISTING_VALUE_PROBABILITY,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.MULTI_POINT_CROSSOVER_PROBABILITY,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.CROSSOVER_PROBABILITY,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.CONSTANT_POOL_PROBABILITY,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.SAMPLE_FUNCTION_OUTPUT_AS_ARGUMENT,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.STRING_ALPHABET,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.STRING_MAX_LENGTH,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.NUMERIC_MAX_VALUE,
  },

  {
    type: MetricType.PROPERTY,
    property: PropertyName.CONFIGURATION,
  },

  // Timing
  {
    type: MetricType.PROPERTY,
    property: PropertyName.TOTAL_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.SEARCH_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.EVALUATIONS,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.ITERATIONS,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.INITIALIZATION_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.PREPROCESS_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.PROCESS_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.POSTPROCESS_TIME,
  },

  {
    type: MetricType.PROPERTY,
    property: PropertyName.TARGET_LOAD_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.INSTRUMENTATION_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.TYPE_RESOLVE_TIME,
  },

  // Archive
  {
    type: MetricType.SERIES,
    seriesName: SeriesName.ARCHIVE_SIZE,
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.ARCHIVE_SIZE,
  },
  {
    type: MetricType.PROPERTY,
    property: PropertyName.MINIMIZED_ARCHIVE_SIZE,
  },
];
