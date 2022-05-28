/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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

import { Archive, getUserInterface, Properties } from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import { readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "fs";
import * as path from "path";
import { JavaScriptDecoder } from "./JavaScriptDecoder";
import { Runner } from "mocha";
import { SilentMochaReporter } from "../testcase/execution/SilentMochaReporter";
const Mocha = require('mocha')
const originalrequire = require("original-require");

export class JavaScriptSuiteBuilder {
  private decoder: JavaScriptDecoder;

  constructor(decoder: JavaScriptDecoder) {
    this.decoder = decoder
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

  /**
   * Removes all files that match the given regex within a certain directory
   * @param dirPath   the directory to clear
   * @param match     the regex to which the files must match
   */
  async clearDirectory(dirPath: string, match = /.*\.(js)/g) {
    const dirContent = await readdirSync(dirPath);

    for (const file of dirContent.filter((el: string) => el.match(match))) {
      await unlinkSync(path.resolve(dirPath, file));
    }
  }

  async createSuite(archive: Archive<JavaScriptTestCase>): Promise<string[]> {
    const reducedArchive = this.reduceArchive(archive);

    const paths: string[] = []
    // write the test cases with logs to know what to assert
    for (const key of reducedArchive.keys()) {
      for (const testCase of reducedArchive.get(key)!) {
        const testPath = path.join(
          Properties.temp_test_directory,
          `test${key}${testCase.id}.spec.ts`
        );
        paths.push(testPath)
        await this.writeTestCase(testPath, testCase, "", true);
      }
    }

    let argv = {
      // package: require('../../../package.json'),
      // _: [],
      require: [ 'ts-node/register' ], // , '@babel/register'
      // config: false,
      // diff: true,
      // extension: [ 'js', 'cjs', 'mjs', 'ts' ],
      // reporter: 'spec',
      // slow: 75,
      // timeout: 2000,
      // ui: 'bdd',
      // 'watch-ignore': [ 'node_modules', '.git' ],
      // watchIgnore: [ 'node_modules', '.git' ]
      spec: paths,
      reporter: SilentMochaReporter
    }

    for (const testPath of paths) {
      const mocha = new Mocha(argv)

      delete originalrequire.cache[testPath];
      mocha.addFile(testPath);


      // By replacing the global log function we disable the output of the truffle test framework
      const old = console.log;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      console.log = () => {};

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
      console.log = old;
    }



    // Create final tests files with assertions
    await this.clearDirectory(Properties.temp_test_directory);

    const finalPaths = []
    for (const key of reducedArchive.keys()) {
      await this.gatherAssertions(reducedArchive.get(key));
      const testPath = path.join(
        Properties.final_suite_directory,
        `test-${key}.spec.ts`
      );
      finalPaths.push(testPath)
      await writeFileSync(
        testPath,
        this.decoder.decode(reducedArchive.get(key), `${key}`, false)
      );
    }

    this.resetInstrumentationData();

    return finalPaths
  }

  async gatherAssertions(testCases: JavaScriptTestCase[]): Promise<void> {
    for (const testCase of testCases) {
      const assertions = new Map<string, string>();
      try {
        // extract the log statements
        const dir = await readdirSync(
          path.join(Properties.temp_log_directory, testCase.id)
        );

        for (const file of dir) {
          const assertionValue = await readFileSync(
            path.join(Properties.temp_log_directory, testCase.id, file),
            "utf8"
          );
          assertions.set(file, assertionValue);
        }
      } catch (error) {
        continue;
      }

      await this.clearDirectory(
        path.join(Properties.temp_log_directory, testCase.id),
        /.*/g
      );
      await rmdirSync(path.join(Properties.temp_log_directory, testCase.id));

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
        .pop()!
        .split(".")[0]!;

      if (!reducedArchive.has(targetName)) {
        reducedArchive.set(targetName, []);
      }

      if (
        reducedArchive
          .get(targetName)
          .includes(archive.getEncoding(objective) as JavaScriptTestCase)
      ) {
        // skip duplicate individuals (i.e. individuals which cover multiple objectives
        continue;
      }

      reducedArchive
        .get(targetName)
        .push(archive.getEncoding(objective) as JavaScriptTestCase);
    }

    return reducedArchive;
  }

  async writeTestCase(filePath: string, testCase: JavaScriptTestCase, targetName: string, addLogs = false): Promise<void> {
    const decodedTestCase = this.decoder.decode(
      testCase,
      targetName,
      addLogs
    );

    // const transpiledTestCase = ts.transpileModule(decodedTestCase, { compilerOptions: { module: ts.ModuleKind.CommonJS }}).outputText
    // await writeFileSync(filePath, transpiledTestCase);

    await writeFileSync(filePath, decodedTestCase);
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
