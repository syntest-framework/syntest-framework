/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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
import { ObjectType, getRelationName } from "@syntest/analysis-javascript";
import { Statement } from "../../../statements/Statement";
import { prng } from "@syntest/prng";
import { Generator } from "../Generator";

export abstract class CallGenerator<S extends Statement> extends Generator<S> {
  sampleArguments(depth: number, type_: ObjectType): Statement[] {
    const arguments_: Statement[] = [];

    for (const [index, parameterId] of type_.parameters.entries()) {
      const element = this.rootContext.getElement(parameterId);

      if (element) {
        const name = "name" in element ? element.name : element.value;

        arguments_[index] = this.sampler.sampleArgument(
          depth + 1,
          parameterId,
          name
        );
        continue;
      }

      const relation = this.rootContext.getRelation(parameterId);

      if (relation) {
        const name = getRelationName(relation.type);
        // TODO look deeper into the relation

        arguments_[index] = this.sampler.sampleArgument(
          depth + 1,
          parameterId,
          name
        );
        continue;
      }

      throw new Error(
        `Could not find element or relation with id ${parameterId}`
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

    return arguments_;
  }
}
