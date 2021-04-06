import { Datapoint } from "../testcase/execution/TestCaseRunner";

/**
 * Results of an execution by the runner.
 *
 * @author Mitchell Olsthoorn
 */
export interface ExecutionResult {
  coversLine(line: number): boolean;
  getTraces(): Datapoint[];
  hasExceptions(): boolean;
  hasTimeout(): boolean;
}
