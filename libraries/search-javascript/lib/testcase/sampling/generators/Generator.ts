/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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
import { RootContext } from "@syntest/analysis-javascript";

import { StatementPool } from "../../StatementPool";
import { Statement } from "../../statements/Statement";
import { JavaScriptTestCaseSampler } from "../JavaScriptTestCaseSampler";

export abstract class Generator<S extends Statement> {
  protected _sampler: JavaScriptTestCaseSampler;
  protected _rootContext: RootContext;

  protected _statementPoolEnabled: boolean;
  protected _statementPoolProbability: number;

  constructor(
    sampler: JavaScriptTestCaseSampler,
    rootContext: RootContext,
    statementPoolEnabled: boolean,
    statementPoolProbability: number
  ) {
    this._sampler = sampler;
    this._rootContext = rootContext;
    this._statementPoolEnabled = statementPoolEnabled;
    this._statementPoolProbability = statementPoolProbability;
  }

  abstract generate(
    depth: number,
    variableIdentifier: string,
    typeIdentifier: string,
    exportIdentifier: string,
    name: string,
    statementPool: StatementPool
  ): S;

  get sampler() {
    return this._sampler;
  }

  get rootContext() {
    return this._rootContext;
  }

  get statementPoolEnabled() {
    return this._statementPoolEnabled;
  }

  get statementPoolProbability() {
    return this._statementPoolProbability;
  }
}
