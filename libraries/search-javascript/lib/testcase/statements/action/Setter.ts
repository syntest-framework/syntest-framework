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
import { Getter } from "./Getter";
import { MethodCall } from "./MethodCall";

/**
 * @author Dimitri Stallenberg
 */
export class Setter extends ActionStatement {
  private readonly _className: string;

  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type always void
   * @param uniqueId id of the gene
   * @param property the name of the property
   * @param arg the argument of the setter
   */
  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    className: string,
    argument: Statement
  ) {
    super(id, name, type, uniqueId, [argument]);
    this._classType = "Setter";
    this._className = className;
  }

  mutate(
    sampler: JavaScriptTestCaseSampler,
    depth: number
  ): Getter | Setter | MethodCall {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleClassCall(depth, this._className);
    }

    let argument = this.args.map((a: Statement) => a.copy())[0];

    argument = argument.mutate(sampler, depth + 1);

    return new Setter(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      this.className,
      argument
    );
  }

  copy(): Setter {
    const deepCopyArgument = this.args.map((a: Statement) => a.copy())[0];

    return new Setter(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      this.className,
      deepCopyArgument
    );
  }

  get className(): string {
    return this._className;
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
    const argument = this.args.map((a) => a.varName).join(", ");

    const argumentStatement: Decoding[] = this.args.flatMap((a) =>
      a.decode(decoder, id, options)
    );

    let decoded = `${objectVariable}.${this.name} = ${argument}`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...argumentStatement,
      {
        decoded: decoded,
        reference: this,
        objectVariable: objectVariable,
      },
    ];
  }

  // TODO
  decodeErroring(objectVariable: string): string {
    const argument = this.args.map((a) => a.varName).join(", ");
    return `await expect(${objectVariable}.${this.name} = ${argument}).to.be.rejectedWith(Error);`;
  }
}
