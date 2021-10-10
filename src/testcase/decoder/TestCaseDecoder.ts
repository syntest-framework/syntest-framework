/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { AbstractTestCase } from "../AbstractTestCase";
import { Statement } from "../statements/Statement";

/**
 * TestCaseDecoder interface.
 *
 * @author Dimitri Stallenberg
 * @author Mitchell Olsthoorn
 */
export interface TestCaseDecoder {
  /**
   * Creates a string version of a test case.
   *
   * @param testCase             the testCase to decode
   * @param addLogs              whether to add log statements in the test case
   * @param additionalAssertions a dictionary of additional assertions to put in the test case
   * @param targetName           the name of the target, used to create informative test cases
   * @return                     the decoded test case
   */
  decodeTestCase(
    testCase: AbstractTestCase | AbstractTestCase[],
    targetName: string,
    addLogs: boolean
  ): string;

  /**
   * Creates a string version of any type of statement.
   *
   * @param statement the statement to decode
   * @return          the decoded statement
   */
  decodeStatement(statement: Statement): string;
}
