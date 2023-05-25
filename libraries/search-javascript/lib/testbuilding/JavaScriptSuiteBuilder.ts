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
  readdirSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";

import { Archive } from "@syntest/search";
import { InstrumentationData } from "@syntest/instrumentation-javascript";
import cloneDeep = require("lodash.clonedeep");
import { Runner } from "mocha";

import { JavaScriptRunner } from "../testcase/execution/JavaScriptRunner";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";

import { JavaScriptDecoder } from "./JavaScriptDecoder";

export class JavaScriptSuiteBuilder {
  private decoder: JavaScriptDecoder;
  private runner: JavaScriptRunner;
  private tempLogDirectory: string;

  constructor(
    decoder: JavaScriptDecoder,
    runner: JavaScriptRunner,
    temporaryLogDirectory: string
  ) {
    this.decoder = decoder;
    this.runner = runner;
    this.tempLogDirectory = temporaryLogDirectory;
  }

  /**
   * Removes all files that match the given regex within a certain directory
   * @param directoryPath   the directory to clear
   * @param match     the regex to which the files must match
   */
  clearDirectory(directoryPath: string, match = /.*\.(js)/g): void {
    const directoryContent = readdirSync(directoryPath);

    for (const file of directoryContent.filter((element: string) =>
      element.match(match)
    )) {
      unlinkSync(path.resolve(directoryPath, file));
    }
  }

  createSuite(
    archive: Map<string, JavaScriptTestCase[]>,
    sourceDirectory: string,
    testDirectory: string,
    addLogs: boolean,
    compact: boolean
  ): string[] {
    const paths: string[] = [];

    // write the test cases with logs to know what to assert
    if (compact) {
      for (const key of archive.keys()) {
        const testPath = path.join(testDirectory, `test-${key}.spec.js`);
        paths.push(testPath);
        writeFileSync(
          testPath,
          this.decoder.decode(
            archive.get(key),
            `${key}`,
            addLogs,
            sourceDirectory
          )
        );
      }
    } else {
      for (const key of archive.keys()) {
        for (const testCase of archive.get(key)) {
          const testPath = path.join(
            testDirectory,
            `test${key}${testCase.id}.spec.js`
          );
          paths.push(testPath);
          writeFileSync(
            testPath,
            this.decoder.decode(testCase, "", addLogs, sourceDirectory)
          );
        }
      }
    }

    return paths;
  }

  async runSuite(paths: string[]) {
    const runner: Runner = await this.runner.run(paths);

    const stats = runner.stats;

    const instrumentationData = <InstrumentationData>(
      cloneDeep(
        (<{ __coverage__: InstrumentationData }>(<unknown>global)).__coverage__
      )
    );

    this.runner.resetInstrumentationData();

    return { stats, instrumentationData };
  }

  gatherAssertions(testCases: JavaScriptTestCase[]): void {
    for (const testCase of testCases) {
      const assertions = new Map<string, string>();
      try {
        // extract the log statements
        const logDirectory = readdirSync(
          path.join(this.tempLogDirectory, testCase.id)
        );

        for (const file of logDirectory) {
          const assertionValue = readFileSync(
            path.join(this.tempLogDirectory, testCase.id, file),
            "utf8"
          );
          assertions.set(file, assertionValue);
        }
      } catch {
        continue;
      }

      this.clearDirectory(path.join(this.tempLogDirectory, testCase.id), /.*/g);
      rmdirSync(path.join(this.tempLogDirectory, testCase.id));

      testCase.assertions = assertions;
    }
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
