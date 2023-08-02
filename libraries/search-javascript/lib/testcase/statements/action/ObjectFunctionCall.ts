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

import { ActionStatement } from "./ActionStatement";

/**
 * @author Dimitri Stallenberg
 */
export class ObjectFunctionCall extends ActionStatement {
  private readonly _objectName: string;

  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param methodName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    objectName: string,
    arguments_: Statement[]
  ) {
    super(id, name, type, uniqueId, arguments_);
    this._classType = "ObjectFunctionCall";
    this._objectName = objectName;
  }

  mutate(
    sampler: JavaScriptTestCaseSampler,
    depth: number
  ): ObjectFunctionCall {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleObjectFunctionCall(depth, this._objectName);
    }

    const arguments_ = this.args.map((a: Statement) => a.copy());

    if (arguments_.length > 0) {
      const index = prng.nextInt(0, arguments_.length - 1);

      arguments_[index] = arguments_[index].mutate(sampler, depth + 1);
    }

    return new ObjectFunctionCall(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      this.className,
      arguments_
    );
  }

  copy(): ObjectFunctionCall {
    const deepCopyArguments = this.args.map((a: Statement) => a.copy());

    return new ObjectFunctionCall(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      this.className,
      deepCopyArguments
    );
  }

  get className(): string {
    return this._objectName;
  }

  decode(): Decoding[] {
    throw new Error("Cannot call decode on method calls!");
  }

  decodeWithObject(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean },
    objectVariable: string
  ): Decoding[] {
    const arguments_ = this.args.map((a) => a.varName).join(", ");

    const argumentStatements: Decoding[] = this.args.flatMap((a) =>
      a.decode(decoder, id, options)
    );

    let decoded = `const ${this.varName} = await ${objectVariable}.${this.name}(${arguments_})`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...argumentStatements,
      {
        decoded: decoded,
        reference: this,
        objectVariable: objectVariable,
      },
    ];
  }

  // TODO
  decodeErroring(objectVariable: string): string {
    const arguments_ = this.args.map((a) => a.varName).join(", ");
    return `await expect(${objectVariable}.${this.name}(${arguments_})).to.be.rejectedWith(Error);`;
  }
}