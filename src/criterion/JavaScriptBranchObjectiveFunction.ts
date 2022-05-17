import { BranchObjectiveFunction, Encoding } from "../../../syntest-framework";
import { BranchDistance } from "./BranchDistance";

export class JavaScriptBranchObjectiveFunction<T extends Encoding> extends BranchObjectiveFunction<T> {
  calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();

    if (executionResult === undefined) {
      return Number.MAX_VALUE;
    }

    // let's check if the line is covered
    if (executionResult.coversLine(this._line)) {
      const branchTrace = executionResult
        .getTraces()
        .find(
          (trace) =>
            trace.type === "branch" &&
            trace.line === this._line &&
            trace.branchType === this._type
        );

      // TODO check this
      if (!branchTrace) {
        // the instrumentation might not pick up every branch
        return Number.MAX_VALUE
      }

      if (branchTrace.hits > 0) {
        return 0;
      } else {
        const oppositeBranch = executionResult.getTraces().find(
          (trace) =>
            trace.type === "branch" &&
            trace.id === branchTrace.id && // Same branch id
            trace.branchType !== this._type // The opposite branch type
        );

        return BranchDistance.branchDistance(
          oppositeBranch.condition,
          oppositeBranch.condition_ast,
          oppositeBranch.variables,
          this._type
        )
      }
    }
  }
}