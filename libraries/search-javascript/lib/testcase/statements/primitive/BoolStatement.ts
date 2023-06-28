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
 * @author Dimitri Stallenberg
 */
export class BoolStatement extends PrimitiveStatement<boolean> {
  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    value: boolean
  ) {
    super(id, name, type, uniqueId, value);
    this._classType = "BoolStatement";
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleArgument(depth + 1, this.id, this.name);
    }

    return new BoolStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      !this.value
    );
  }

  copy(): BoolStatement {
    return new BoolStatement(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      this.value
    );
  }

  getFlatTypes(): string[] {
    return ["bool"];
  }
}
