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

import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Statement } from "../Statement";

import { PrimitiveStatement } from "./PrimitiveStatement";

export class BoolStatement extends PrimitiveStatement<boolean> {
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    uniqueId: string,
    value: boolean
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      TypeEnum.BOOLEAN,
      uniqueId,
      value
    );
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.deltaMutationProbability)) {
      // 80%
      return new BoolStatement(
        this.variableIdentifier,
        this.typeIdentifier,
        this.name,
        prng.uniqueId(),
        !this.value
      );
    } else {
      // 20%
      return sampler.sampleArgument(
        depth + 1,
        this.variableIdentifier,
        this.name
      );
    }
  }

  copy(): BoolStatement {
    return new BoolStatement(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.uniqueId,
      this.value
    );
  }
}
