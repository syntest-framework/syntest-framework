import { Datapoint } from "../testcase/execution/TestCaseRunner";

/**
 * Results of an execution by the runner.
 *
 * @author Mitchell Olsthoorn
 */
export interface ExecutionResult {
  /**
   * Determine if a specific line has been covered in the traces.
   *
   * @param line The line to check for
   */
  coversLine(line: number): boolean;

  /**
   * Return the duration of the execution.
   */
  getDuration(): number;

  /**
   * Return all exceptions that occurred during the execution.
   */
  getExceptions();

  /**
   * Return all the traces produced by the execution.
   */
  getTraces(): Datapoint[];

  /**
   * Return if any exceptions occurred during the execution.
   */
  hasExceptions(): boolean;

  /**
   * Return if the execution has passed.
   */
  hasPassed(): boolean;

  /**
   * Return if the execution timed out.
   */
  hasTimedOut(): boolean;
}
