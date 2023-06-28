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

import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";

import { PrimitiveStatement } from "./PrimitiveStatement";
import { Statement } from "../Statement";

/**
 * Generic number class
 *
 * @author Dimitri Stallenberg
 */
export class IntegerStatement extends PrimitiveStatement<number> {
  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    value: number
  ) {
    super(id, name, type, uniqueId, Math.round(value));
    this._classType = "IntegerStatement";
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleArgument(depth + 1, this.id, this.name);
    }

    if (prng.nextBoolean(sampler.deltaMutationProbability)) {
      return this.deltaMutation(sampler);
    }

    return sampler.sampleInteger(this.id, this.name);
  }

  deltaMutation(sampler: JavaScriptTestCaseSampler): IntegerStatement {
    // small mutation
    const change = prng.nextGaussian(0, 20);

    let newValue = Math.round(this.value + change);

    // If illegal values are not allowed we make sure the value does not exceed the specified bounds
    if (!sampler.exploreIllegalValues) {
      const max = Number.MAX_SAFE_INTEGER;
      const min = Number.MIN_SAFE_INTEGER;

      if (newValue > max) {
        newValue = max;
      } else if (newValue < min) {
        newValue = min;
      }
    }

    return new IntegerStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue
    );
  }

  copy(): IntegerStatement {
    return new IntegerStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      this.value
    );
  }

  getFlatTypes(): string[] {
    return ["integer"];
  }
}
