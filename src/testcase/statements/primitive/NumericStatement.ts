/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Solidity.
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

import {
  prng,
  Properties,
  Parameter,
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { PrimitiveStatement } from "./PrimitiveStatement";

/**
 * Generic number class
 *
 * @author Dimitri Stallenberg
 */
export class NumericStatement extends PrimitiveStatement<number> {
  constructor(
    type: Parameter,
    uniqueId: string,
    value: number
  ) {
    super(type, uniqueId, value);
    this._classType = 'NumericStatement'
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): NumericStatement {
    if (prng.nextBoolean(Properties.delta_mutation_probability)) {
      return this.deltaMutation();
    }

    return NumericStatement.getRandom(
      this.type
    );
  }

  deltaMutation(): NumericStatement {
    // small mutation
    let change = prng.nextGaussian(0, 20);

    if (this.type.type.includes("int")) {
      change = Math.round(change);
      if (change == 0) change = prng.nextBoolean() ? -1 : 1;
    }

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
      this.type,
      prng.uniqueId(),
      newValue
    );
  }

  copy(): NumericStatement {
    return new NumericStatement(
      this.type,
      prng.uniqueId(),
      this.value
    );
  }

  static getRandom(
    type: Parameter = { type: "number", name: "noname" }
  ): NumericStatement {
    // by default we create small numbers (do we need very large numbers?)
    const max = Number.MAX_SAFE_INTEGER
    const min = Number.MIN_SAFE_INTEGER

    return new NumericStatement(
      type,
      prng.uniqueId(),
      prng.nextDouble(min, max),
    );
  }
}
