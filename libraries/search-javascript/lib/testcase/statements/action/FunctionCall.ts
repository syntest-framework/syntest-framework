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

import { Export, TypeEnum } from "@syntest/analysis-javascript";
import { prng } from "@syntest/prng";

import { ContextBuilder } from "../../../testbuilding/ContextBuilder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

import { ActionStatement } from "./ActionStatement";

/**
 * @author Dimitri Stallenberg
 */
export class FunctionCall extends ActionStatement {
  /**
   * Constructor
   * @param uniqueId id of the gene
   * @param functionName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    uniqueId: string,
    arguments_: Statement[],
    export_: Export
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      TypeEnum.FUNCTION,
      uniqueId,
      arguments_,
      export_
    );
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): FunctionCall {
    // replace entire function call
    const arguments_ = this.args.map((a: Statement) => a.copy());

    if (arguments_.length > 0) {
      const index = prng.nextInt(0, arguments_.length - 1);
      arguments_[index] = arguments_[index].mutate(sampler, depth + 1);
    }

    return new FunctionCall(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      prng.uniqueId(),
      arguments_,
      this.export
    );
  }

  copy(): FunctionCall {
    const deepCopyArguments = this.args.map((a: Statement) => a.copy());

    return new FunctionCall(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.uniqueId,
      deepCopyArguments,
      this.export
    );
  }

  decode(context: ContextBuilder): Decoding[] {
    const argumentDecoding: Decoding[] = this.args.flatMap((a) =>
      a.decode(context)
    );

    const arguments_ = this.args
      .map((a) => context.getOrCreateVariableName(a))
      .join(", ");

    const import_ = context.getOrCreateImportName(this.export);
    const decoded = `const ${context.getOrCreateVariableName(
      this
    )} = await ${import_}(${arguments_})`;

    return [
      ...argumentDecoding,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }
}
