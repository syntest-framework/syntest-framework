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

import {
  prng, Properties,
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { ActionStatement } from "./ActionStatement";
import { Decoding, Statement } from "../Statement";
import * as path from "path";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";

/**
 * @author Dimitri Stallenberg
 */
export class MethodCall extends ActionStatement {
  private readonly _functionName: string;

  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param functionName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    identifierDescription: IdentifierDescription,
    type: string,
    uniqueId: string,
    functionName: string,
    args: Statement[]
  ) {
    super(identifierDescription, type, uniqueId, args);
    this._classType = "MethodCall"
    this._functionName = functionName;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): MethodCall {
    const args = [...this.args.map((a: Statement) => a.copy())];

    if (args.length !== 0) {
      const index = prng.nextInt(0, args.length - 1);

      if (prng.nextBoolean(Properties.resample_gene_probability)) { // TODO should be different property
        args[index] = sampler.sampleArgument(depth + 1, args[index].identifierDescription)
      } else {
        args[index] = args[index].mutate(sampler, depth + 1);
      }
    }

    return new MethodCall(
      this.identifierDescription,
      this.type,
      prng.uniqueId(),
      this.functionName,
      args
    );
  }

  copy(): MethodCall {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];

    return new MethodCall(
      this.identifierDescription,
      this.type,
      this.id,
      this.functionName,
      deepCopyArgs
    );
  }

  get functionName(): string {
    return this._functionName;
  }

  decode(id: string, options: { addLogs: boolean, exception: boolean }): Decoding[] {
    throw new Error('Cannot call decode on method calls!')
  }

  decodeWithObject(id: string, options: { addLogs: boolean, exception: boolean }, objectVariable: string): Decoding[] {
    const args = this.args
      .map((a) => a.varName)
      .join(', ')

    const argStatements: Decoding[] = this.args
      .flatMap((a) => a.decode(id, options))

    let decoded = `const ${this.varName} = await ${objectVariable}.${this.functionName}(${args})`

    if (options.addLogs) {
      const logDir = path.join(
        Properties.temp_log_directory,
        id,
        this.varName
      )
      decoded += `\nawait fs.writeFileSync('${logDir}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`
    }

    return [
      ...argStatements,
      {
        decoded: decoded,
        reference: this,
        objectVariable: objectVariable
      }
    ]
  }

  // TODO
  decodeErroring(objectVariable: string): string {
    const args = this.args.map((a) => a.varName).join(', ')
    return `await expect(${objectVariable}.${this.functionName}(${args})).to.be.rejectedWith(Error);`;

  }


}
