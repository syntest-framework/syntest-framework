/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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
import { ObjectType } from "@syntest/analysis-javascript";
import { prng } from "@syntest/prng";

import { Statement } from "../../../statements/Statement";
import { Generator } from "../Generator";

export abstract class CallGenerator<S extends Statement> extends Generator<S> {
  sampleArguments(depth: number, type_: ObjectType): Statement[] {
    const arguments_: Statement[] = [];

    for (const [index, parameterId] of type_.parameters.entries()) {
      const name = type_.parameterNames.get(index);
      arguments_[index] = this.sampler.sampleArgument(
        depth + 1,
        parameterId,
        name
      );
    }

    // if some params are missing, fill them with fake params
    const parameterIds = [...type_.parameters.values()];
    for (let index = 0; index < arguments_.length; index++) {
      if (!arguments_[index]) {
        arguments_[index] = this.sampler.sampleArgument(
          depth + 1,
          prng.pickOne(parameterIds),
          String(index)
        );
      }
    }

    for (let index = 0; index < 10; index++) {
      if (prng.nextBoolean(0.05)) {
        // TODO make this a config parameter
        arguments_.push(this.sampler.sampleArgument(depth + 1, "anon", "anon"));
      }
    }

    return arguments_;
  }
}
