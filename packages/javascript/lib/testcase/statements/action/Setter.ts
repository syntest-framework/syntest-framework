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

import { CONFIG, prng } from "@syntest/core";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { ActionStatement } from "./ActionStatement";
import { Decoding, Statement } from "../Statement";
import * as path from "path";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";

/**
 * @author Dimitri Stallenberg
 */
export class Setter extends ActionStatement {
  private readonly _property: string;

  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type always void
   * @param uniqueId id of the gene
   * @param property the name of the property
   * @param arg the argument of the setter
   */
  constructor(
    identifierDescription: IdentifierDescription,
    type: string,
    uniqueId: string,
    property: string,
    arg: Statement
  ) {
    super(identifierDescription, type, uniqueId, [arg]);
    this._classType = "Setter";
    this._property = property;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Setter {
    let arg = [...this.args.map((a: Statement) => a.copy())][0];

    if (prng.nextBoolean(CONFIG.resampleGeneProbability)) {
      // TODO should be different property
      arg = sampler.sampleArgument(depth + 1, arg.identifierDescription);
    } else {
      arg = arg.mutate(sampler, depth + 1);
    }

    return new Setter(
      this.identifierDescription,
      this.type,
      prng.uniqueId(),
      this.property,
      arg
    );
  }

  copy(): Setter {
    const deepCopyArg = [...this.args.map((a: Statement) => a.copy())][0];

    return new Setter(
      this.identifierDescription,
      this.type,
      this.id,
      this.property,
      deepCopyArg
    );
  }

  get property(): string {
    return this._property;
  }

  decode(): Decoding[] {
    throw new Error("Cannot call decode on method calls!");
  }

  decodeWithObject(
    id: string,
    options: { addLogs: boolean; exception: boolean },
    objectVariable: string
  ): Decoding[] {
    const arg = this.args.map((a) => a.varName).join(", ");

    const argStatement: Decoding[] = this.args.flatMap((a) =>
      a.decode(id, options)
    );

    let decoded = `${objectVariable}.${this.property} = ${arg}`;

    if (options.addLogs) {
      const logDir = path.join(CONFIG.tempLogDirectory, id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDir}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...argStatement,
      {
        decoded: decoded,
        reference: this,
        objectVariable: objectVariable,
      },
    ];
  }

  // TODO
  decodeErroring(objectVariable: string): string {
    const arg = this.args.map((a) => a.varName).join(", ");
    return `await expect(${objectVariable}.${this.property} = ${arg}).to.be.rejectedWith(Error);`;
  }
}
