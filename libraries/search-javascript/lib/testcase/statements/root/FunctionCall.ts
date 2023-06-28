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

import { prng } from "@syntest/prng";

import { JavaScriptDecoder } from "../../../testbuilding/JavaScriptDecoder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

import { RootStatement } from "./RootStatement";

/**
 * @author Dimitri Stallenberg
 */
export class FunctionCall extends RootStatement {
  /**
   * Constructor
   * @param type the return identifierDescription of the function
   * @param uniqueId id of the gene
   * @param functionName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    arguments_: Statement[]
  ) {
    super(id, name, type, uniqueId, arguments_, []);
    this._classType = "FunctionCall";
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): FunctionCall {
    // replace entire function call
    const arguments_ = this.args.map((a: Statement) => a.copy());

    if (arguments_.length > 0) {
      // go over each arg
      for (let index = 0; index < arguments_.length; index++) {
        if (prng.nextBoolean(1 / arguments_.length)) {
          arguments_[index] = arguments_[index].mutate(sampler, depth + 1);
        }
      }
    }

    return new FunctionCall(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      arguments_
    );
  }

  copy(): FunctionCall {
    const deepCopyArguments = this.args.map((a: Statement) => a.copy());

    return new FunctionCall(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      deepCopyArguments
    );
  }

  decode(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean }
  ): Decoding[] {
    const arguments_ = this.args.map((a) => a.varName).join(", ");

    const argumentStatements: Decoding[] = this.args.flatMap((a) =>
      a.decode(decoder, id, options)
    );

    let decoded = `const ${this.varName} = await ${this.name}(${arguments_})`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...argumentStatements,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }

  decodeErroring(): string {
    const arguments_ = this.args.map((a) => a.varName).join(", ");
    return `await expect(${this.name}(${arguments_})).to.be.rejectedWith(Error);`;
  }
}
