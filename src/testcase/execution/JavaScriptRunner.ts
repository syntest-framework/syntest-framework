import { ExecutionResult, Properties, SuiteBuilder, TestCaseRunner } from "@syntest/framework";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { JavaScriptSubject } from "../../search/JavaScriptSubject";
import * as path from "path";
import { JavaScriptExecutionResult, JavaScriptExecutionStatus } from "../../search/JavaScriptExecutionResult";

export class JavaScriptRunner extends TestCaseRunner {
  constructor(suiteBuilder: SuiteBuilder) {
    super(suiteBuilder);
  }

  async execute(
    subject: JavaScriptSubject<JavaScriptTestCase>,
    testCase: JavaScriptTestCase
  ): Promise<ExecutionResult> {
    const testPath = path.join(Properties.temp_test_directory, "tempTest.js");
    await this.suiteBuilder.writeTestCase(testPath, testCase, subject.name);

    // TODO

    let executionResult: JavaScriptExecutionResult = new JavaScriptExecutionResult(
      JavaScriptExecutionStatus.PASSED,
      [],
      0,
    );

    return executionResult
  }
}