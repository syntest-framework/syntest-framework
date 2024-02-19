/*
 * Copyright 2020-2023 SynTest contributors
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

import { TypeEnum } from "@syntest/analysis-javascript";
import { prng } from "@syntest/prng";

import { ContextBuilder } from "../../../testbuilding/ContextBuilder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding } from "../Statement";

import { ClassActionStatement } from "./ClassActionStatement";
import { ConstructorCall } from "./ConstructorCall";

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

  decode(context: ContextBuilder): Decoding[] {
    const constructorDecoding = this.constructor_.decode(context);

    const decoded = `const ${context.getOrCreateVariableName(
      this
    )} = await ${context.getOrCreateVariableName(this.constructor_)}.${
      this.name
    }`;

    return [
      ...constructorDecoding,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }
}
