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
import { Target } from "@syntest/analysis";
import { StorageManager } from "@syntest/storage";

import { JavaScriptRunner } from "../testcase/execution/JavaScriptRunner";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";

import { JavaScriptDecoder } from "./JavaScriptDecoder";

export class JavaScriptSuiteBuilder {
  private storageManager: StorageManager;
  private decoder: JavaScriptDecoder;
  private runner: JavaScriptRunner;

  constructor(
    storageManager: StorageManager,
    decoder: JavaScriptDecoder,
    runner: JavaScriptRunner
  ) {
    this.storageManager = storageManager;
    this.decoder = decoder;
    this.runner = runner;
  }

  async runSuite(
    archive: Map<Target, JavaScriptTestCase[]>,
    sourceDirectory: string,
    testDirectory: string,
    gatherAssertionData: boolean,
    compact: boolean,
    final = false
  ) {
    const paths: string[] = [];

    // write the test cases with logs to know what to assert
    let totalAmount = 0;
    if (compact) {
      for (const target of archive.keys()) {
        totalAmount += archive.get(target).length;
        const decodedTest = this.decoder.decode(
          archive.get(target),
          gatherAssertionData,
          sourceDirectory
        );
        const testPath = this.storageManager.store(
          [testDirectory],
          `test-${target.name}.spec.js`,
          decodedTest,
          !final
        );
        paths.push(testPath);
      }
    } else {
      for (const target of archive.keys()) {
        totalAmount += archive.get(target).length;
        for (const testCase of archive.get(target)) {
          const decodedTest = this.decoder.decode(
            testCase,
            gatherAssertionData,
            sourceDirectory
          );
          const testPath = this.storageManager.store(
            [testDirectory],
            `test${target.name}${testCase.id}.spec.js`,
            decodedTest,
            !final
          );

          paths.push(testPath);
        }
      }
    }

    if (final) {
      // eslint-disable-next-line unicorn/no-null
      return null;
    }

    const { stats, instrumentationData, assertionData } = await this.runner.run(
      paths,
      totalAmount * 2
    );
    if (assertionData) {
      // put assertion data on testCases
      for (const [id, data] of Object.entries(assertionData)) {
        const testCase = [...archive.values()].flat().find((x) => x.id === id);
        if (!testCase) {
          throw new Error("invalid id");
        }

        testCase.assertionData = data;
      }
    }

    // TODO use the results of the tests to show some statistics

    return { stats, instrumentationData };
  }
}
