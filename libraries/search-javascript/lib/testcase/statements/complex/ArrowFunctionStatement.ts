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

// TODO

import { prng } from "@syntest/prng";

import { JavaScriptDecoder } from "../../../testbuilding/JavaScriptDecoder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

/**
 * @author Dimitri Stallenberg
 */
export class ArrowFunctionStatement extends Statement {
  private _parameters: string[];
  private _returnValue: Statement | undefined;

  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    parameters: string[],
    returnValue: Statement | undefined
  ) {
    super(id, name, type, uniqueId);
    this._parameters = parameters;
    this._returnValue = returnValue;
    this._classType = "ArrowFunctionStatement";
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleArgument(depth, this.id, this.name);
    }

    return new ArrowFunctionStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      this._parameters,
      this.returnValue
        ? this._returnValue.mutate(sampler, depth + 1)
        : undefined
    );
  }

  copy(): ArrowFunctionStatement {
    return new ArrowFunctionStatement(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      this._parameters,
      this._returnValue
    );
  }

  decode(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean }
  ): Decoding[] {
    if (this._returnValue === undefined) {
      return [
        {
          decoded: `const ${this.varName} = (${this._parameters.join(
            ", "
          )}) => { };`,
          reference: this,
        },
      ];
    }
    const returnStatement: Decoding[] = this._returnValue.decode(
      decoder,
      id,
      options
    );
    return [
      ...returnStatement,
      {
        decoded: `const ${this.varName} = (${this._parameters.join(
          ", "
        )}) => { return ${this.returnValue.varName} };`,
        reference: this,
      },
    ];
  }

  getChildren(): Statement[] {
    if (this._returnValue === undefined) {
      return [];
    }
    return [this.returnValue];
  }

  hasChildren(): boolean {
    return true;
  }

  setChild(index: number, newChild: Statement) {
    this._returnValue = newChild;
  }

  get returnValue(): Statement {
    return this._returnValue;
  }

  getFlatTypes(): string[] {
    return ["arrowfunction"];
  }
}
