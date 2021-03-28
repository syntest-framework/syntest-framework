import { ExecutionResult } from "./ExecutionResult";

/**
 * Encoding of the search problem.
 *
 * @author Mitchell Olsthoorn
 */
export interface Encoding<T extends Encoding<T>> {
  /**
   * Return the execution result.
   */
  getExecutionResult(): ExecutionResult;

  /**
   * Store the execution result.
   *
   * @param executionResult The execution result to store
   */
  setExecutionResult(executionResult: ExecutionResult);
}
