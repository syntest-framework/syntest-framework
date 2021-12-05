/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Solidity.
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

import { Archive, SuiteBuilder, TestCaseDecoder } from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import { writeFileSync } from "fs";

export class SoliditySuiteBuilder extends SuiteBuilder {
  constructor(decoder: TestCaseDecoder) {
    super(decoder);
  }

  async createSuite(archive: Archive<JavaScriptTestCase>): Promise<void> {

    // TODO
    return Promise.resolve(undefined);
  }

  async writeTestCase(filePath: string, testCase: JavaScriptTestCase, targetName: string, addLogs = false): Promise<void> {
    const decodedTestCase = this.decoder.decodeTestCase(
      testCase,
      targetName,
      addLogs
    );
    await writeFileSync(filePath, decodedTestCase);
  }


}