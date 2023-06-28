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

import { PrimitiveStatement } from "./PrimitiveStatement";
import { Statement } from "../Statement";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";

/**
 * @author Dimitri Stallenberg
 */
export class UndefinedStatement extends PrimitiveStatement<boolean> {
  constructor(id: string, name: string, type: string, uniqueId: string) {
    // eslint-disable-next-line unicorn/no-useless-undefined
    super(id, name, type, uniqueId, undefined);
    this._classType = "UndefinedStatement";
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleArgument(depth + 1, this.id, this.name);
    }
    return new UndefinedStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId()
    );
  }

  copy(): UndefinedStatement {
    return new UndefinedStatement(this.id, this.name, this.type, this.uniqueId);
  }

  getFlatTypes(): string[] {
    return ["undefined"];
  }
}
