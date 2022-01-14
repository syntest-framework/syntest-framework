import {
  Datapoint,
  EncodingRunner,
  ExecutionResult, getUserInterface,
  Properties,
} from "@syntest/framework";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { JavaScriptSubject } from "../../search/JavaScriptSubject";
import * as path from "path";
import { JavaScriptExecutionResult, JavaScriptExecutionStatus } from "../../search/JavaScriptExecutionResult";
import { Runner } from "mocha";
import { JavaScriptSuiteBuilder } from "../../testbuilding/JavaScriptSuiteBuilder";
import { handleRequires } from "mocha/lib/cli/run-helpers"
import * as _ from 'lodash'
import { spawn } from "child_process";
const Mocha = require('mocha')
const originalrequire = require("original-require");

export class JavaScriptRunner implements EncodingRunner<JavaScriptTestCase> {
  protected suiteBuilder: JavaScriptSuiteBuilder;

  constructor(suiteBuilder: JavaScriptSuiteBuilder) {
    this.suiteBuilder = suiteBuilder
  }

  async execute(
    subject: JavaScriptSubject,
    testCase: JavaScriptTestCase
  ): Promise<ExecutionResult> {
    const testPath = path.resolve(path.join(Properties.temp_test_directory, "tempTest.spec.js"))

    await this.suiteBuilder.writeTestCase(testPath, testCase, subject.name);

    // TODO make this running in memory

    let argv = {
      spec: testPath
    }

    const mocha = new Mocha(argv)

    // require('ts-node/register')

    require("regenerator-runtime/runtime");
    require('@babel/register')({
      presets: [
        "@babel/preset-env"
      ]
    })

    delete originalrequire.cache[testPath];
    mocha.addFile(testPath);

    // By replacing the global log function we disable the output of the truffle test framework
    const levels = ['log', 'debug', 'info', 'warn', 'error'];
    const originalFunctions = levels.map(level => console[level]);
    levels.forEach((level) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      console[level] = () => {}
    })

    let runner: Runner = null

    // Finally, run mocha.
    process.on("unhandledRejection", reason => {
      throw reason;
    });

    await new Promise((resolve) => {
      runner = mocha.run((failures) => {
        resolve(failures)
      })
    })

    levels.forEach((level, index) => {
      console[level] = originalFunctions[index]
    })

    const stats = runner.stats

    // If one of the executions failed, log it
    if (stats.failures > 0) {
      getUserInterface().error("Test case has failed!");
    }

    // Retrieve execution traces
    const instrumentationData = _.cloneDeep(global.__coverage__)

    const traces: Datapoint[] = [];
    for (const key of Object.keys(instrumentationData)) {
      if (instrumentationData[key].path.includes(subject.name))
        for (const functionKey of Object.keys(instrumentationData[key].fnMap)) {
          const fn = instrumentationData[key].fnMap[functionKey]
          const hits = instrumentationData[key].f[functionKey]

          traces.push({
            id: `f-${fn.line}`,
            type: "function",
            path: key,
            line: fn.line,

            hits: hits,
          })
        }

        for (const statementKey of Object.keys(instrumentationData[key].statementMap)) {
          const statement = instrumentationData[key].statementMap[statementKey]
          const hits = instrumentationData[key].s[statementKey]

          traces.push({
            id: `f-${statement.line}`,
            type: "statement",
            path: key,
            line: statement.line,

            hits: hits,
          })
        }

        for (const branchKey of Object.keys(instrumentationData[key].branchMap)) {
          const branch = instrumentationData[key].branchMap[branchKey]
          const hits = instrumentationData[key].b[branchKey]

          traces.push({
            id: `b-${branch.line}`,
            path: key,
            type: "branch",
            line: branch.line,

            locationIdx: 0,
            branchType: true,

            hits: hits[0],

            // TODO
            left: [],
            opcode: "",
            right: [],
          });

          traces.push({
            id: `b-${branch.line}`,
            path: key,
            type: "branch",
            line: branch.line,

            locationIdx: 1,
            branchType: false,

            hits: hits[1],

            // TODO
            left: [],
            opcode: "",
            right: [],
          });
        }

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
    this.resetInstrumentationData();

    // Remove test file
    await this.suiteBuilder.deleteTestCase(testPath);

    return executionResult;
  }

  resetInstrumentationData () {
    for (const key of Object.keys(global.__coverage__)) {
      for (const statementKey of Object.keys(global.__coverage__[key].s)) {
        global.__coverage__[key].s[statementKey] = 0
      }
      for (const functionKey of Object.keys(global.__coverage__[key].f)) {
        global.__coverage__[key].f[functionKey] = 0
      }
      for (const branchKey of Object.keys(global.__coverage__[key].b)) {
        global.__coverage__[key].b[branchKey] = [0, 0]
      }
    }
  }
}
