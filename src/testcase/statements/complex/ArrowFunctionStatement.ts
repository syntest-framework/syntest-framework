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

// TODO
import { prng, Properties } from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";

/**
 * @author Dimitri Stallenberg
 */
export class ArrowFunctionStatement extends Statement {
  private _returnValue: Statement;

  constructor(identifierDescription: IdentifierDescription, type: string, uniqueId: string, returnValue: Statement) {
    super(identifierDescription, type, uniqueId);
    this._returnValue = returnValue
    this._classType = 'ArrowFunctionStatement'
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): ArrowFunctionStatement {
    // TODO mutate returnvalue identifierDescription
    if (prng.nextBoolean(Properties.resample_gene_probability)) { // TODO should be different property
      return new ArrowFunctionStatement(this.identifierDescription, this.type, prng.uniqueId(), sampler.sampleArgument(depth + 1, this._returnValue.identifierDescription));
    }

    return new ArrowFunctionStatement(this.identifierDescription, this.type, prng.uniqueId(), this._returnValue.mutate(sampler, depth + 1));
  }

  copy(): ArrowFunctionStatement {
    return new ArrowFunctionStatement(this.identifierDescription, this.type, this.id, this._returnValue);
  }

  decode(id: string, options: { addLogs: boolean, exception: boolean }): Decoding[] {
    const returnStatement: Decoding[] = this._returnValue.decode(id, options)
    return [
      ...returnStatement,
      {
        decoded: `const ${this.varName} = () => { return ${this.returnValue.varName} };`,
        reference: this
      }
    ];
  }

  getChildren(): Statement[] {
    return [this.returnValue];
  }

  hasChildren(): boolean {
    return true;
  }

  setChild(index: number, newChild: Statement) {
    this._returnValue = newChild
  }

  get returnValue(): Statement {
    return this._returnValue;
  }

  getFlatTypes(): string[] {
    return [
      "arrowfunction"
    ]
  }
}
