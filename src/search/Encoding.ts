import { ExecutionResult } from "./ExecutionResult";
import { ObjectiveFunction } from "./objective/ObjectiveFunction";

/**
 * Encoding of the search problem.
 *
 * @author Mitchell Olsthoorn
 */
export interface Encoding {
  /**
   * Store the distance to an objective for this encoding.
   *
   * @param objectiveFunction The objective
   * @param distance The distance
   */
  setObjective(
    objectiveFunction: ObjectiveFunction<Encoding>,
    distance: number
  );

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
