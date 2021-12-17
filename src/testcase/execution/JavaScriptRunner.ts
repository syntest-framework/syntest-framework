import {
  EncodingRunner,
  ExecutionResult,
  Properties,
} from "@syntest/framework";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { JavaScriptSubject } from "../../search/JavaScriptSubject";
import * as path from "path";
import { JavaScriptExecutionResult, JavaScriptExecutionStatus } from "../../search/JavaScriptExecutionResult";
import { Runner } from "mocha";
import { JavaScriptSuiteBuilder } from "../../testbuilding/JavaScriptSuiteBuilder";

export class JavaScriptRunner implements EncodingRunner<JavaScriptTestCase> {
  protected suiteBuilder: JavaScriptSuiteBuilder;

  constructor(suiteBuilder: JavaScriptSuiteBuilder) {
    this.suiteBuilder = suiteBuilder
  }

  async execute(
    subject: JavaScriptSubject<JavaScriptTestCase>,
    testCase: JavaScriptTestCase
  ): Promise<ExecutionResult> {
    const testPath = path.join(Properties.temp_test_directory, "tempTest.js");

    await this.suiteBuilder.writeTestCase(testPath, testCase, subject.name);

    // TODO make this running in memory

    const mocha = new Mocha()

    mocha.addFile(testPath);

    const runner: Runner = await new Promise<Runner>((resolve, reject) => {
      resolve(mocha.run(function(failures) {
        process.on('exit', function () {
          process.exit(failures); // TODO maybe not exit?
        });
      }))
    })

    const stats = runner.stats

    // If one of the executions failed, log it
    if (stats.failures > 0) {
      // TODO
      // getUserInterface().error("Test case has failed!");
    }

    // Retrieve execution traces
    const instrumentationData = null // TODO get info from the saved instrumentation data//this.api.getInstrumentationData();

    const traces = [];
    for (const key of Object.keys(instrumentationData)) {
      if (instrumentationData[key].contractPath.includes(subject.name))
        traces.push(instrumentationData[key]);
    }

    // Retrieve execution information
    let executionResult: JavaScriptExecutionResult;
    if (
      runner.suite.suites.length > 0 &&
      runner.suite.suites[0].tests.length > 0
    ) {
      const test = runner.suite.suites[0].tests[0];

      let status: JavaScriptExecutionStatus;
      let exception: string = null;

      if (test.isPassed()) {
        status = JavaScriptExecutionStatus.PASSED;
      } else if (test.timedOut) {
        status = JavaScriptExecutionStatus.TIMED_OUT;
      } else {
        status = JavaScriptExecutionStatus.FAILED;
        exception = test.err.message;
      }

      const duration = test.duration;

      executionResult = new JavaScriptExecutionResult(
        status,
        traces,
        duration,
        exception
      );
    } else {
      executionResult = new JavaScriptExecutionResult(
        JavaScriptExecutionStatus.FAILED,
        traces,
        stats.duration
      );
    }

    // Reset instrumentation data (no hits)
    // TODO // this.api.resetInstrumentationData();

    // Remove test file
    await this.suiteBuilder.deleteTestCase(testPath);

    return executionResult;
  }
}