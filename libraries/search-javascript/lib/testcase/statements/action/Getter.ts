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
import { Decoding } from "../Statement";

import { ClassActionStatement } from "./ClassActionStatement";
import { ConstructorCall } from "./ConstructorCall";
import { TypeEnum } from "@syntest/analysis-javascript";

/**
 * @author Dimitri Stallenberg
 */
export class Getter extends ClassActionStatement {
  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type the type of property
   * @param uniqueId id of the gene
   * @param property the name of the property
   */
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    uniqueId: string,
    constructor_: ConstructorCall
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      TypeEnum.FUNCTION,
      uniqueId,
      [],
      constructor_
    );
    this._classType = "Getter";
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Getter {
    const constructor_ = this.constructor_.mutate(sampler, depth + 1);

    return new Getter(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      prng.uniqueId(),
      constructor_
    );
  }

  copy(): Getter {
    return new Getter(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.uniqueId,
      this.constructor_.copy()
    );
  }

  decode(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean }
  ): Decoding[] {
    let decoded = `const ${this.varName} = await ${this.constructor_.varName}.${this.name}`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...this.constructor_.decode(decoder, id, options),
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }

  // TODO
  decodeErroring(): string {
    return `await expect(${this.constructor_.varName}.${this.name}).to.be.rejectedWith(Error);`;
  }
}
