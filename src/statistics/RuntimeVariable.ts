/**
 * Runtime variables that can be recorded.
 */
export enum RuntimeVariable {
  /**
   * General
   */
  SEED,
  SUBJECT,

  /**
   * Search
   */
  EVALUATIONS,
  ITERATIONS,

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
