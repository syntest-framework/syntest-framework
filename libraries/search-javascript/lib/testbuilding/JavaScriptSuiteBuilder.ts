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
import { Archive } from "@syntest/search";
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
    archive: Map<string, JavaScriptTestCase[]>,
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
      for (const key of archive.keys()) {
        totalAmount += archive.get(key).length;
        const decodedTest = this.decoder.decode(
          archive.get(key),
          `${key}`,
          gatherAssertionData,
          sourceDirectory
        );
        const testPath = this.storageManager.store(
          [testDirectory],
          `test-${key}.spec.js`,
          decodedTest,
          !final
        );
        paths.push(testPath);
      }
    } else {
      for (const key of archive.keys()) {
        totalAmount += archive.get(key).length;
        for (const testCase of archive.get(key)) {
          const decodedTest = this.decoder.decode(
            testCase,
            "",
            gatherAssertionData,
            sourceDirectory
          );
          const testPath = this.storageManager.store(
            [testDirectory],
            `test${key}${testCase.id}.spec.js`,
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

  reduceArchive(
    archive: Archive<JavaScriptTestCase>
  ): Map<string, JavaScriptTestCase[]> {
    const reducedArchive = new Map<string, JavaScriptTestCase[]>();

    for (const objective of archive.getObjectives()) {
      const targetName = objective
        .getSubject()
        .name.split("/")
        .pop()
        .split(".")[0];

      if (!reducedArchive.has(targetName)) {
        reducedArchive.set(targetName, []);
      }

      if (
        reducedArchive.get(targetName).includes(archive.getEncoding(objective))
      ) {
        // skip duplicate individuals (i.e. individuals which cover multiple objectives
        continue;
      }

      reducedArchive.get(targetName).push(archive.getEncoding(objective));
    }

    return reducedArchive;
  }
}
