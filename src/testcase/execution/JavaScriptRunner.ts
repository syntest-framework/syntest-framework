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
const Mocha = require('mocha')

export class JavaScriptRunner implements EncodingRunner<JavaScriptTestCase> {
  protected suiteBuilder: JavaScriptSuiteBuilder;

  constructor(suiteBuilder: JavaScriptSuiteBuilder) {
    this.suiteBuilder = suiteBuilder
  }

  async execute(
    subject: JavaScriptSubject<JavaScriptTestCase>,
    testCase: JavaScriptTestCase
  ): Promise<ExecutionResult> {
    const testPath = path.join(Properties.temp_test_directory, "tempTest.ts");

    await this.suiteBuilder.writeTestCase(testPath, testCase, subject.name);

    // TODO make this running in memory

    let argv = {
      package: require('../../../package.json'),
      _: [],
      require: [ 'ts-node/register', '@babel/register' ],
      config: false,
      diff: true,
      extension: [ 'js', 'cjs', 'mjs' ],
      reporter: 'spec',
      slow: 75,
      timeout: 2000,
      ui: 'bdd',
      'watch-ignore': [ 'node_modules', '.git' ],
      watchIgnore: [ 'node_modules', '.git' ],
      spec: [ './test/**/*.ts' ],

    }
    // // load requires first, because it can impact "plugin" validation
    // const plugins = await handleRequires(requires);
    // Object.assign(argv, plugins);

// console.log(plugins)
//     console.log(argv)
    const mocha = new Mocha(argv)

    mocha.addFile(testPath);
    // await mocha.loadFilesAsync()

    const runner: Runner = await new Promise<Runner>((resolve, reject) => {
      const _runner = mocha.run(function(failures) {
        process.on('exit', function () {
          process.exit(failures); // TODO maybe not exit?
        });
        resolve(_runner)
      })
    })

    const stats = runner.stats

    // If one of the executions failed, log it
    if (stats.failures > 0) {
      getUserInterface().error("Test case has failed!");
    }

    // Retrieve execution traces
    const instrumentationData = _.cloneDeep(global.__coverage__)//null // TODO get info from the saved instrumentation data//this.api.getInstrumentationData();

    const traces: Datapoint[] = [];
    for (const key of Object.keys(instrumentationData)) {
      if (instrumentationData[key].path.includes(subject.name))
        for (const branchKey of Object.keys(instrumentationData[key].branchMap)) {
          const branch = instrumentationData[key].branchMap[branchKey]
          const hits = instrumentationData[key].b[branchKey]

          traces.push({
            id: `${branch.line}${branch.type}`,
            line: branch.line,
            type: "branch",

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
            line: branch.line,
            type: "branch",

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
    // TODO // this.api.resetInstrumentationData();

    // Remove test file
    await this.suiteBuilder.deleteTestCase(testPath);

    return executionResult;
  }
}