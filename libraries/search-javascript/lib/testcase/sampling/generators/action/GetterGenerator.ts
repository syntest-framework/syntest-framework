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
import { prng } from "@syntest/prng";

import { StatementPool } from "../../../StatementPool";
import { Getter } from "../../../statements/action/Getter";

import { CallGenerator } from "./CallGenerator";

export class GetterGenerator extends CallGenerator<Getter> {
  override generate(
    depth: number,
    variableIdentifier: string,
    typeIdentifier: string,
    exportIdentifier: string,
    name: string,
    _statementPool: StatementPool,
  ): Getter {
    const constructor_ = this.sampler.sampleConstructorCall(
      depth + 1,
      exportIdentifier,
    );

    return new Getter(
      variableIdentifier,
      typeIdentifier,
      name,
      prng.uniqueId(),
      constructor_,
    );
  }
}
