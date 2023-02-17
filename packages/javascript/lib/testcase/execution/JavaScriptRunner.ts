/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  CONFIG,
  Datapoint,
  EncodingRunner,
  ExecutionResult,
  getUserInterface,
} from "@syntest/core";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { JavaScriptSubject } from "../../search/JavaScriptSubject";
import * as path from "path";
import {
  JavaScriptExecutionResult,
  JavaScriptExecutionStatus,
} from "../../search/JavaScriptExecutionResult";
import cloneDeep = require("lodash.clonedeep");
import { SilentMochaReporter } from "./SilentMochaReporter";
import ExecutionInformationIntegrator from "./ExecutionInformationIntegrator";

import { Runner } from "mocha";
import { unlinkSync, writeFileSync } from "fs";
import { JavaScriptDecoder } from "../../testbuilding/JavaScriptDecoder";
import Mocha = require("mocha");
import originalrequire = require("original-require");

export class JavaScriptRunner implements EncodingRunner<JavaScriptTestCase> {
  protected decoder: JavaScriptDecoder;
  protected errorProcessor: ExecutionInformationIntegrator;

  constructor(decoder: JavaScriptDecoder) {
    this.decoder = decoder;
    this.errorProcessor = new ExecutionInformationIntegrator();

    process.on("uncaughtException", (reason) => {
      throw reason;
    });
    process.on("unhandledRejection", (reason) => {
      throw reason;
    });
  }

  async writeTestCase(
    filePath: string,
    testCase: JavaScriptTestCase,
    targetName: string,
    addLogs = false
  ): Promise<void> {
    const decodedTestCase = this.decoder.decode(testCase, targetName, addLogs);

    await writeFileSync(filePath, decodedTestCase);
  }

  /**
   * Deletes a certain file.
   *
   * @param filepath  the filepath of the file to delete
   */
  async deleteTestCase(filepath: string) {
    try {
      await unlinkSync(filepath);
    } catch (error) {
      getUserInterface().debug(error);
    }
  }

  async run(paths: string[]): Promise<Runner> {
    paths = paths.map((p) => path.resolve(p));

    const argv: Mocha.MochaOptions = <Mocha.MochaOptions>(<unknown>{
      spec: paths,
      reporter: SilentMochaReporter,
    });

    const mocha = new Mocha(argv); // require('ts-node/register')

    // eslint-disable-next-line
    require("regenerator-runtime/runtime");
    // eslint-disable-next-line
    require("@babel/register")({
      presets: [require.resolve("@babel/preset-env")],
    });

    for (const _path of paths) {
      delete originalrequire.cache[_path];
      mocha.addFile(_path);
    }

    let runner: Runner = null;

    // Finally, run mocha.
    await new Promise((resolve) => {
      runner = mocha.run((failures) => resolve(failures));
    });

    await mocha.dispose();
    return runner;
  }

  async execute(
    subject: JavaScriptSubject,
    testCase: JavaScriptTestCase
  ): Promise<ExecutionResult> {
    const testPath = path.resolve(
      path.join(CONFIG.tempTestDirectory, "tempTest.spec.js")
    );

    await this.writeTestCase(testPath, testCase, subject.name);

    const runner = await this.run([testPath]);

    const stats = runner.stats;

    const test = runner.suite.suites[0].tests[0];

    // If one of the executions failed, log it
    if (stats.failures > 0) {
      this.errorProcessor.processError(testCase, test);
    } else {
      this.errorProcessor.processSuccess(testCase, test);
    }

    // Retrieve execution traces
    const instrumentationData = cloneDeep(global.__coverage__);
    const metaData = cloneDeep(global.__meta__);

    const traces: Datapoint[] = [];
    for (const key of Object.keys(instrumentationData)) {
      for (const functionKey of Object.keys(instrumentationData[key].fnMap)) {
        const fn = instrumentationData[key].fnMap[functionKey];
        const hits = instrumentationData[key].f[functionKey];

        traces.push({
          id: `f-${fn.line}`,
          type: "function",
          path: key,
          line: fn.line,

          hits: hits,
        });
      }

      for (const statementKey of Object.keys(
        instrumentationData[key].statementMap
      )) {
        const statement = instrumentationData[key].statementMap[statementKey];
        const hits = instrumentationData[key].s[statementKey];

        traces.push({
          id: `s-${statement.start.line}`,
          type: "statement",
          path: key,
          line: statement.start.line,

          hits: hits,
        });
      }

      for (const branchKey of Object.keys(instrumentationData[key].branchMap)) {
        const branch = instrumentationData[key].branchMap[branchKey];
        const hits = instrumentationData[key].b[branchKey];
        const meta = metaData?.[key]?.meta?.[branchKey];

        traces.push({
          id: `b-${branch.line}`,
          path: key,
          type: "branch",
          line: branch.line,

          locationIdx: 0,
          branchType: true,

          hits: hits[0],

          condition_ast: meta?.condition_ast,
          condition: meta?.condition,
          variables: meta?.variables,
        });

        traces.push({
          id: `b-${branch.line}`,
          path: key,
          type: "branch",
          line: branch.line,

          locationIdx: 1,
          branchType: false,

          hits: hits[1],

          condition_ast: meta?.condition_ast,
          condition: meta?.condition,
          variables: meta?.variables,
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
    await this.deleteTestCase(testPath);

    return executionResult;
  }

  resetInstrumentationData() {
    for (const key of Object.keys(global.__coverage__)) {
      for (const statementKey of Object.keys(global.__coverage__[key].s)) {
        global.__coverage__[key].s[statementKey] = 0;
      }
      for (const functionKey of Object.keys(global.__coverage__[key].f)) {
        global.__coverage__[key].f[functionKey] = 0;
      }
      for (const branchKey of Object.keys(global.__coverage__[key].b)) {
        global.__coverage__[key].b[branchKey] = [0, 0];
      }
    }
  }
}
