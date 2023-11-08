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
import { ConstructorCall } from "../../../statements/action/ConstructorCall";
import { Statement } from "../../../statements/Statement";

import { CallGenerator } from "./CallGenerator";

export class ConstructorCallGenerator extends CallGenerator<ConstructorCall> {
  override generate(
    depth: number,
    variableIdentifier: string,
    typeIdentifier: string,
    exportIdentifier: string,
    name: string,
    statementPool: StatementPool
  ): ConstructorCall {
    const export_ = [...this.rootContext.getAllExports().values()]
      .flat()
      .find((export_) => export_.id === exportIdentifier);

    if (this.statementPoolEnabled) {
      const statementFromPool =
        statementPool.getRandomConstructor(exportIdentifier);

      if (
        statementFromPool &&
        prng.nextBoolean(this.statementPoolProbability)
      ) {
        return statementFromPool;
      }
    }

    const type_ = this.rootContext
      .getTypeModel()
      .getObjectDescription(typeIdentifier);

    const arguments_: Statement[] = this.sampleArguments(depth, type_);

    return new ConstructorCall(
      variableIdentifier,
      typeIdentifier,
      exportIdentifier,
      name,
      prng.uniqueId(),
      arguments_,
      export_
    );
  }
}
