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

import { Getter } from "./Getter";
import { Setter } from "./Setter";
import { ConstructorCall } from "./ConstructorCall";
import { ClassActionStatement } from "./ClassActionStatement";

/**
 * @author Dimitri Stallenberg
 */
export class MethodCall extends ClassActionStatement {
  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param methodName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    type: string,
    uniqueId: string,
    arguments_: Statement[],
    constructor_: ConstructorCall
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      type,
      uniqueId,
      arguments_,
      constructor_
    );
    this._classType = "MethodCall";
  }

  mutate(
    sampler: JavaScriptTestCaseSampler,
    depth: number
  ): Getter | Setter | MethodCall {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleClassAction(depth);
    }

    const probability = 1 / (this.args.length + 1); // plus one for the constructor

    const arguments_ = this.args.map((a: Statement) => a.copy());

    if (arguments_.length > 0) {
      // go over each arg
      for (let index = 0; index < arguments_.length; index++) {
        if (prng.nextBoolean(probability)) {
          arguments_[index] = arguments_[index].mutate(sampler, depth + 1);
        }
      }
    }

    const constructor_ = prng.nextBoolean(probability)
      ? this.constructor_.mutate(sampler, depth + 1)
      : this.constructor_.copy();

    return new MethodCall(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      prng.uniqueId(),
      arguments_,
      constructor_
    );
  }

  copy(): MethodCall {
    const deepCopyArguments = this.args.map((a: Statement) => a.copy());

    return new MethodCall(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      this.uniqueId,
      deepCopyArguments,
      this.constructor_.copy()
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

    let decoded = `const ${this.varName} = await ${this.constructor_.varName}.${this.name}(${arguments_})`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...this.constructor_.decode(decoder, id, options),
      ...argumentStatements,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }

  // TODO
  decodeErroring(): string {
    const arguments_ = this.args.map((a) => a.varName).join(", ");
    return `await expect(${this.constructor_.varName}.${this.name}(${arguments_})).to.be.rejectedWith(Error);`;
  }
}
