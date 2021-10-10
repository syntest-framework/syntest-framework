/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

/**
 * Runtime variables that can be recorded.
 */
export enum RuntimeVariable {
  /**
   * General
   */
  CONFIGURATION,
  SEED,
  SUBJECT,
  VERSION,

  /**
   * Search
   */
  ALGORITHM,
  EVALUATIONS,
  ITERATIONS,
  PROBE_ENABLED,
  CONSTANT_POOL_ENABLED,

  /**
   * Objectives
   */
  COVERED_OBJECTIVES,
  OBJECTIVE_VALUE,
  TOTAL_OBJECTIVES,

  /**
   * Coverage
   */
  BRANCH_COVERAGE,
  FUNCTION_COVERAGE,
  LINE_COVERAGE,
  PROBE_COVERAGE,
  COVERAGE,
  COVERED_BRANCHES,
  COVERED_EXCEPTIONS,
  COVERED_FUNCTIONS,
  COVERED_LINES,
  COVERED_PROBES,
  TOTAL_BRANCHES,
  TOTAL_FUNCTIONS,
  TOTAL_LINES,
  TOTAL_PROBES,

  /**
   * Time
   */
  INITIALIZATION_TIME,
  SEARCH_TIME,
  TOTAL_TIME,

  /**
   * Archive
   */
  ARCHIVE_SIZE,
  MINIMIZED_SIZE,
}
