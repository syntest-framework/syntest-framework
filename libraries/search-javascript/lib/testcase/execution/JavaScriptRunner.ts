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

import { ChildProcess, fork } from "node:child_process";
import * as path from "node:path";

import {
  InstrumentationData,
  InstrumentationDataMap,
  MetaData,
  MetaDataMap,
} from "@syntest/instrumentation-javascript";
import { getLogger, Logger } from "@syntest/logging";
import { EncodingRunner, ExecutionResult, Trace } from "@syntest/search";
import { StorageManager } from "@syntest/storage";

import {
  JavaScriptExecutionResult,
  JavaScriptExecutionStatus,
} from "../../search/JavaScriptExecutionResult";
import { JavaScriptDecoder } from "../../testbuilding/JavaScriptDecoder";
import { JavaScriptTestCase } from "../JavaScriptTestCase";

import { ExecutionInformationIntegrator } from "./ExecutionInformationIntegrator";
import { DoneMessage, Message } from "./TestExecutor";

export class JavaScriptRunner implements EncodingRunner<JavaScriptTestCase> {
  protected static LOGGER: Logger;

  protected storageManager: StorageManager;
  protected decoder: JavaScriptDecoder;
  protected executionInformationIntegrator: ExecutionInformationIntegrator;

  protected tempTestDirectory: string;

  protected executionTimeout: number;
  protected testTimeout: number;

  protected silenceTestOutput: boolean;

  private _process: ChildProcess;

  constructor(
    storageManager: StorageManager,
    decoder: JavaScriptDecoder,
    executionInformationIntergrator: ExecutionInformationIntegrator,
    temporaryTestDirectory: string,
    executionTimeout: number,
    testTimeout: number,
    silenceTestOutput: boolean
  ) {
    JavaScriptRunner.LOGGER = getLogger(JavaScriptRunner.name);
    this.storageManager = storageManager;
    this.decoder = decoder;
    this.executionInformationIntegrator = executionInformationIntergrator;
    this.tempTestDirectory = temporaryTestDirectory;
    this.executionTimeout = executionTimeout;
    this.testTimeout = testTimeout;
    this.silenceTestOutput = silenceTestOutput;

    // eslint-disable-next-line unicorn/prefer-module
    this._process = fork(path.join(__dirname, "TestExecutor.js"));
  }

  async run(
    paths: string[],
    amount = 1
  ): Promise<Omit<DoneMessage, "message">> {
    if (amount < 1) {
      throw new Error(`Amount of tests cannot be smaller than 1`);
    }
    paths = paths.map((p) => path.resolve(p));

    if (!this._process.connected || this._process.killed) {
      // eslint-disable-next-line unicorn/prefer-module
      this._process = fork(path.join(__dirname, "TestExecutor.js"));
    }

    const childProcess = this._process;

    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        JavaScriptRunner.LOGGER.warn(
          `Execution timeout reached killing process, timeout: ${this.executionTimeout} times ${amount}`
        );
        childProcess.removeAllListeners();
        childProcess.kill();
        reject("timeout");
      }, this.executionTimeout * amount);

      childProcess.on("message", (data: Message) => {
        if (typeof data !== "object") {
          return reject(
            new TypeError("Invalid data received from child process")
          );
        }

        if (data.message === "done") {
          childProcess.removeAllListeners();
          clearTimeout(timeout);
          if (!data.instrumentationData) {
            return reject("no instrumentation data found");
          }

          return resolve(data);
        }
      });

      childProcess.on("error", (error) => {
        reject(error);
      });

      childProcess.send({
        message: "run",
        silent: this.silenceTestOutput,
        paths: paths,
        timeout: this.testTimeout,
      });
    });
  }

  async executeMultiple(testCases: JavaScriptTestCase[]): Promise<void> {
    for (const testCase of testCases) {
      testCase.setExecutionResult(await this.execute(testCase));
    }
  }

  async execute(testCase: JavaScriptTestCase): Promise<ExecutionResult> {
    JavaScriptRunner.LOGGER.silly("Executing test case");

    const decodedTestCase = this.decoder.decode(testCase, false);

    const testPath = this.storageManager.store(
      [this.tempTestDirectory],
      "tempTest.spec.js",
      decodedTestCase,
      true
    );

    let executionResult: JavaScriptExecutionResult;
    const last = Date.now();
    try {
      const { suites, stats, instrumentationData, metaData, assertionData } =
        await this.run([testPath]);
      JavaScriptRunner.LOGGER.debug(`test run took: ${Date.now() - last} ms`);
      const test = suites[0].tests[0]; // only one test in this case

      // If one of the executions failed, log it
      this.executionInformationIntegrator.process(testCase, test, stats);

      const traces: Trace[] = this._extractTraces(
        instrumentationData,
        metaData
      );

      // Retrieve execution information
      executionResult = new JavaScriptExecutionResult(
        test.status,
        traces,
        test.duration,
        test.error
      );

      if (assertionData && assertionData[testCase.id]) {
        testCase.assertionData = assertionData[testCase.id];
      }
    } catch (error) {
      if (error === "timeout") {
        // we put undefined as exception such that the test case doesnt end up in the final test suite
        JavaScriptRunner.LOGGER.debug(`test run took: ${Date.now() - last} ms`);
        executionResult = new JavaScriptExecutionResult(
          JavaScriptExecutionStatus.INFINITE_LOOP,
          [],
          -1,
          undefined
        );
      } else {
        JavaScriptRunner.LOGGER.error(String(error));
        throw error;
      }
    }

    // Remove test file
    this.storageManager.deleteTemporary(
      [this.tempTestDirectory],
      "tempTest.spec.js"
    );

    return executionResult;
  }

  private _extractTraces(
    instrumentationData: InstrumentationDataMap,
    metaData: MetaDataMap
  ): Trace[] {
    const traces: Trace[] = [];

    for (const key of Object.keys(instrumentationData)) {
      for (const functionKey of Object.keys(instrumentationData[key].fnMap)) {
        const function_ = instrumentationData[key].fnMap[functionKey];
        const hits = instrumentationData[key].f[functionKey];

        traces.push({
          id: function_.decl.id,
          type: "function",
          path: key,
          location: function_.decl,

          hits: hits,
        });
      }

      for (const statementKey of Object.keys(
        instrumentationData[key].statementMap
      )) {
        const statement = instrumentationData[key].statementMap[statementKey];
        const hits = instrumentationData[key].s[statementKey];

        traces.push({
          id: statement.id,
          type: "statement",
          path: key,
          location: statement,

          hits: hits,
        });
      }

      traces.push(
        ...this._extractBranchTraces(
          key,
          instrumentationData[key],
          metaData !== undefined && key in metaData ? metaData[key] : undefined
        )
      );
    }

    return traces;
  }

  private _extractBranchTraces(
    key: string,
    instrumentationData: InstrumentationData,
    metaData: MetaData
  ): Trace[] {
    const traces: Trace[] = [];
    for (const branchKey of Object.keys(instrumentationData.branchMap)) {
      const branch = instrumentationData.branchMap[branchKey];
      const hits = <number[]>instrumentationData.b[branchKey];
      let meta;

      if (metaData !== undefined) {
        const metaMeta = metaData.meta;
        meta = metaMeta[branchKey.toString()];
      }

      for (const [index, location] of branch.locations.entries()) {
        traces.push({
          id: location.id,
          path: key,
          type: "branch",
          location: branch.locations[index],

          hits: hits[index],

          condition: meta?.condition,
          variables: meta?.variables,
        });
      }

      if (
        !(
          branch.locations.length > 2 || // more than 2 means switch
          branch.locations.length === 2 || // equal to 2 means if statement (or small switch)
          (branch.locations.length === 1 && branch.type === "default-arg")
        ) // equal to 1 means default arg
      ) {
        // otherwise something is wrong
        throw new Error(
          `Invalid number of locations for branch type: ${branch.type}`
        );
      }
    }

    return traces;
  }

  get process() {
    return this._process;
  }
}
