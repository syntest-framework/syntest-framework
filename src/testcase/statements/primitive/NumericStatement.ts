/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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

import { prng, Properties } from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { PrimitiveStatement } from "./PrimitiveStatement";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";

/**
 * Generic number class
 *
 * @author Dimitri Stallenberg
 */
export class NumericStatement extends PrimitiveStatement<number> {
  constructor(identifierDescription: IdentifierDescription, type: string, uniqueId: string, value: number) {
    super(identifierDescription, type, uniqueId, value);
    this._classType = 'NumericStatement'
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): NumericStatement {
    if (prng.nextBoolean(Properties.resample_gene_probability)) {
      return sampler.sampleNumber(this.identifierDescription, this.type);
    }

    if (prng.nextBoolean(Properties.delta_mutation_probability)) {
      return this.deltaMutation();
    }

    return sampler.sampleNumber(
      this.identifierDescription,
      this.type
    );
  }

  deltaMutation(): NumericStatement {
    // small mutation
    const change = prng.nextGaussian(0, 20);

    let newValue = this.value + change;

    // If illegal values are not allowed we make sure the value does not exceed the specified bounds
    if (!Properties.explore_illegal_values) {
      const max = Number.MAX_SAFE_INTEGER;
      const min = Number.MIN_SAFE_INTEGER;

      if (newValue > max) {
        newValue = max;
      } else if (newValue < min) {
        newValue = min;
      }
    }

    return new NumericStatement(
      this.identifierDescription,
      this.type,
      prng.uniqueId(),
      newValue
    );
  }

  copy(): NumericStatement {
    return new NumericStatement(
      this.identifierDescription,
      this.type,
      prng.uniqueId(),
      this.value
    );
  }

  getFlatTypes(): string[] {
    return ["number"]
  }
}
