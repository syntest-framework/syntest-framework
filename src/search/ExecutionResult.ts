import { Datapoint } from "../testcase/execution/TestCaseRunner";

/**
 * Results of an execution by the runner.
 */
export interface ExecutionResult {
  coversLine(line: number): boolean;
  getTraces(): Datapoint[];
  hasExceptions(): boolean;
  hasTimeout(): boolean;
}
