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

import { Export, TypeEnum } from "@syntest/analysis-javascript";
import { prng } from "@syntest/prng";

import { ContextBuilder } from "../../../testbuilding/ContextBuilder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding } from "../Statement";

import { ActionStatement } from "./ActionStatement";

export class ConstantObject extends ActionStatement {
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    uniqueId: string,
    export_: Export
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      TypeEnum.OBJECT,
      uniqueId,
      [],
      export_
    );
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): ConstantObject {
    // delta mutations are non existance here so we make a copy instead
    return prng.nextBoolean(sampler.deltaMutationProbability)
      ? this.copy()
      : sampler.constantObjectGenerator.generate(
          depth,
          this.variableIdentifier,
          this.typeIdentifier,
          this.export.id,
          this.name,
          sampler.statementPool
        );
  }

  copy(): ConstantObject {
    return new ConstantObject(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.uniqueId,
      this.export
    );
  }

  decode(context: ContextBuilder): Decoding[] {
    const import_ = context.getOrCreateImportName(this.export);
    const decoded = `const ${context.getOrCreateVariableName(
      this
    )} = ${import_}`;

    return [
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }
}
