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

import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { Statement } from "../statements/Statement";
import Mocha = require("mocha");

export default class ExecutionInformationIntegrator {
  // eslint-disable-next-line
  processSuccess(testCase: JavaScriptTestCase, testResult: Mocha.Test) {
    // TODO
    // const queue: Statement[] = [testCase.root]
    //
    // while (queue.length) {
    //   const root = queue.pop()
    //   const children = root.getChildren()
    //
    //   for (const child of children) {
    //     child.identifierDescription.typeProbabilityMap.addExecutionScore(child.type, 1)
    //     queue.push(child)
    //   }
    // }
  }

  processError(testCase: JavaScriptTestCase, testResult: Mocha.Test) {
    // console.log(testResult.err.name)
    // console.log(testResult.err.message)
    // console.log()

    // if (!testResult.err.stack.split('\n')[2].includes('tempTest.spec.js')) {
    //   // console.log(testResult.err)
    //   // console.log()
    //   return
    // }
    //
    // if (testResult.err.name !== 'TypeError') {
    //   return
    // }

    // console.log(testResult.err)

    const queue: Statement[] = [testCase.root];

    while (queue.length) {
      const root = queue.pop();
      const children = root.getChildren();

      for (const child of children) {
        if (testResult.err.message.includes(child.identifierDescription.name)) {
          // console.log(child.identifierDescription.typeProbabilityMap)
          // console.log(testResult.err)
          child.identifierDescription.typeProbabilityMap.addExecutionScore(
            child.type,
            -1
          );
        }
        queue.push(child);
      }
    }
  }
}
