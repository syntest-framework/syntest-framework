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
  COVERAGE,
  COVERED_BRANCHES,
  COVERED_EXCEPTIONS,
  COVERED_FUNCTIONS,
  COVERED_LINES,
  TOTAL_BRANCHES,
  TOTAL_FUNCTIONS,
  TOTAL_LINES,

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
