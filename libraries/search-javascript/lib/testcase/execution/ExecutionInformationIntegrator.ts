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

import { TypeModel } from "@syntest/analysis-javascript";
import Mocha = require("mocha");

import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { Statement } from "../statements/Statement";

import { Test } from "./TestExecutor";

export class ExecutionInformationIntegrator {
  private _typeModel: TypeModel;

  constructor(typeModel: TypeModel) {
    this._typeModel = typeModel;
  }

  process(testCase: JavaScriptTestCase, testResult: Test, stats: Mocha.Stats) {
    if (stats.failures === 0) {
      return;
    }

    const queue: Statement[] = testCase.roots;

    while (queue.length > 0) {
      const root = queue.pop();
      const children = root.getChildren();

      for (const child of children) {
        if (
          testResult.error &&
          testResult.error.message &&
          testResult.error.message.includes(child.name)
        ) {
          this._typeModel.addExecutionScore(
            child.variableIdentifier,
            child.typeIdentifier,
            child.ownType
          );
        }
        queue.push(child);
      }
    }
  }
}
