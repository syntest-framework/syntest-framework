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
import { SuiteBuilder } from "../decoder/SuiteBuilder";
import { EncodingRunner } from "../../search/EncodingRunner";
import { ExecutionResult } from "../../search/ExecutionResult";
import { SearchSubject } from "../../search/SearchSubject";

export interface Datapoint {
  id: string;
  type: string;
  locationIdx: number;
  branchType: boolean;
  line: number;
  hits: number;
  opcode: string;
  left: number[];
  right: number[];
}

export abstract class TestCaseRunner
  implements EncodingRunner<AbstractTestCase>
{
  protected _suiteBuilder: SuiteBuilder;

  protected constructor(suiteBuilder: SuiteBuilder) {
    this._suiteBuilder = suiteBuilder;
  }

  get suiteBuilder(): SuiteBuilder {
    return this._suiteBuilder;
  }

  public abstract execute(
    subject: SearchSubject<AbstractTestCase>,
    encoding: AbstractTestCase
  ): Promise<ExecutionResult>;
}
