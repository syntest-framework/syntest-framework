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

import { ContextBuilder } from "../../../testbuilding/ContextBuilder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

import { ClassActionStatement } from "./ClassActionStatement";
import { ConstructorCall } from "./ConstructorCall";

/**
 * MethodCall
 */
export class MethodCall extends ClassActionStatement {
  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param uniqueId id of the gene
   * @param methodName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    uniqueId: string,
    arguments_: Statement[],
    constructor_: ConstructorCall
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      TypeEnum.FUNCTION,
      uniqueId,
      arguments_,
      constructor_
    );
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): MethodCall {
    const arguments_ = this.args.map((a: Statement) => a.copy());
    let constructor_ = this.constructor_.copy();
    const index = prng.nextInt(0, arguments_.length);

    if (index < arguments_.length) {
      // go over each arg
      arguments_[index] = arguments_[index].mutate(sampler, depth + 1);
    } else {
      constructor_ = constructor_.mutate(sampler, depth + 1);
    }

    return new MethodCall(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      prng.uniqueId(),
      arguments_,
      constructor_
    );
  }

  copy(): MethodCall {
    const deepCopyArguments = this.args.map((a: Statement) => a.copy());

    return new MethodCall(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.uniqueId,
      deepCopyArguments,
      this.constructor_.copy()
    );
  }

  decode(context: ContextBuilder): Decoding[] {
    const constructorDecoding = this.constructor_.decode(context);
    const argumentsDecoding: Decoding[] = this.args.flatMap((a) =>
      a.decode(context)
    );

    const arguments_ = this.args
      .map((a) => context.getOrCreateVariableName(a))
      .join(", ");

    const decoded = `const ${context.getOrCreateVariableName(
      this
    )} = await ${context.getOrCreateVariableName(this.constructor_)}.${
      this.name
    }(${arguments_})`;

    return [
      ...constructorDecoding,
      ...argumentsDecoding,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }
}
