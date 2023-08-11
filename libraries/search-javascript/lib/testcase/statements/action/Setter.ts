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
import { MethodCall } from "./MethodCall";
import { ClassActionStatement } from "./ClassActionStatement";
import { ConstructorCall } from "./ConstructorCall";

/**
 * @author Dimitri Stallenberg
 */
export class Setter extends ClassActionStatement {
  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type always void
   * @param uniqueId id of the gene
   * @param property the name of the property
   * @param arg the argument of the setter
   */
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    type: string,
    uniqueId: string,
    argument: Statement,
    constructor_: ConstructorCall
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      type,
      uniqueId,
      [argument],
      constructor_
    );
    this._classType = "Setter";
  }

  mutate(
    sampler: JavaScriptTestCaseSampler,
    depth: number
  ): Getter | Setter | MethodCall {
    let argument = this.args.map((a: Statement) => a.copy())[0];
    let constructor_ = this.constructor_.copy();

    if (prng.nextBoolean(0.5)) {
      argument = argument.mutate(sampler, depth + 1);
    } else {
      constructor_ = constructor_.mutate(sampler, depth + 1);
    }

    return new Setter(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      prng.uniqueId(),
      argument,
      constructor_
    );
  }

  copy(): Setter {
    const deepCopyArgument = this.args.map((a: Statement) => a.copy())[0];

    return new Setter(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      this.uniqueId,
      deepCopyArgument,
      this.constructor_.copy()
    );
  }

  decode(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean }
  ): Decoding[] {
    const argument = this.args.map((a) => a.varName).join(", ");

    const argumentStatement: Decoding[] = this.args.flatMap((a) =>
      a.decode(decoder, id, options)
    );

    let decoded = `${this.constructor_.varName}.${this.name} = ${argument}`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...this.constructor_.decode(decoder, id, options),
      ...argumentStatement,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }

  // TODO
  decodeErroring(): string {
    const argument = this.args.map((a) => a.varName).join(", ");
    return `await expect(${this.constructor_.varName}.${this.name} = ${argument}).to.be.rejectedWith(Error);`;
  }
}
