/*
 * Copyright 2020-2023 SynTest contributors
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
import { ImplementationError } from "@syntest/diagnostics";
import { InstrumentationDataMap } from "@syntest/instrumentation-javascript";
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

  /**
   *
   * @param archive
   * @param sourceDirectory
   * @param testDirectory
   * @param gatherAssertionData
   * @param compact decides whether the tests in each archive are put into a single file
   * @param final
   */
  createSuite(
    archive: Map<Target, JavaScriptTestCase[]>,
    sourceDirectory: string,
    testDirectory: string,
    gatherAssertionData: boolean,
    compact: boolean,
    final = false
  ) {
    const paths: { [key: string]: number } = {};

    for (const target of archive.keys()) {
      if (compact) {
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

        if (paths[testPath] !== undefined) {
          throw new ImplementationError("Should only be one of each path!");
        }

        paths[testPath] = archive.get(target).length;
      } else {
        for (const testCase of archive.get(target)) {
          const decodedTest = this.decoder.decode(
            testCase,
            gatherAssertionData,
            sourceDirectory
          );
          const testPath = this.storageManager.store(
            [testDirectory],
            `test-${target.name}-${testCase.id}.spec.js`,
            decodedTest,
            !final
          );

          if (paths[testPath] !== undefined) {
            throw new ImplementationError("Should only be one of each path!");
          }

          paths[testPath] = 1;
        }
      }
    }

    return paths;
  }

  /**
   *
   * @param archive
   * @param sourceDirectory
   * @param testDirectory
   * @param gatherAssertionData
   * @returns
   */
  async runSuite(
    archive: Map<Target, JavaScriptTestCase[]>,
    paths: { [key: string]: number },
    gatherAssertionData: boolean
  ) {
    const results = [];

    for (const [filePath, amount] of Object.entries(paths)) {
      const { stats, instrumentationData, assertionData } =
        await this.runner.run([filePath], amount * 2);

      if (gatherAssertionData && assertionData) {
        // put assertion data on testCases
        for (const [id, data] of Object.entries(assertionData)) {
          const testCase = [...archive.values()]
            .flat()
            .find((x) => x.id === id);
          if (!testCase) {
            throw new ImplementationError("invalid id");
          }

          testCase.assertionData = data;
        }
      }

      results.push({ stats, instrumentationData });
    }

    return results;
  }

  summariseResults(
    results: {
      stats: Mocha.Stats;
      instrumentationData: InstrumentationDataMap;
    }[],
    targets: Target[]
  ) {
    type Summary = {
      branch: {
        covered: Set<string>;
        total: Set<string>;
      };
      statement: {
        covered: Set<string>;
        total: Set<string>;
      };
      function: {
        covered: Set<string>;
        total: Set<string>;
      };
    };

    const summaryTotal = {
      failures: 0,
      data: new Map<Target, Summary>(),
    };

    for (const { stats, instrumentationData } of results) {
      summaryTotal.failures += stats.failures;

      for (const file of Object.keys(instrumentationData)) {
        const target = targets.find((target: Target) => target.path === file);
        if (!target) {
          continue;
        }

        const data = instrumentationData[file];

        let summary: Summary = {
          branch: {
            covered: new Set(),
            total: new Set(),
          },
          statement: {
            covered: new Set(),
            total: new Set(),
          },
          function: {
            covered: new Set(),
            total: new Set(),
          },
        };
        if (summaryTotal.data.has(target)) {
          summary = summaryTotal.data.get(target);
        } else {
          summaryTotal.data.set(target, summary);
        }

        for (const statementKey of Object.keys(data.s)) {
          summary["statement"].total.add(statementKey);
          if (data.s[statementKey]) {
            summary["statement"].covered.add(statementKey);
          }
        }

        for (const branchKey of Object.keys(data.b)) {
          for (const branchIndex of data.b[branchKey].keys()) {
            summary["branch"].total.add(
              branchKey + " - " + String(branchIndex)
            );

            if (data.b[branchKey][branchIndex]) {
              summary["branch"].covered.add(
                branchKey + " - " + String(branchIndex)
              );
            }
          }
        }

        for (const functionKey of Object.keys(data.f)) {
          summary["function"].total.add(functionKey);

          if (data.f[functionKey]) {
            summary["function"].covered.add(functionKey);
          }
        }
      }
    }

    return summaryTotal;
  }
}
