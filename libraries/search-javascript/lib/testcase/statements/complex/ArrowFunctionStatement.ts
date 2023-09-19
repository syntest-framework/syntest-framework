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

import { TypeEnum } from "@syntest/analysis-javascript";
import { prng } from "@syntest/prng";
import { shouldNeverHappen } from "@syntest/search";

import { ContextBuilder } from "../../../testbuilding/ContextBuilder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

/**
 * @author Dimitri Stallenberg
 */
export class ArrowFunctionStatement extends Statement {
  private _parameters: string[];
  private _returnValue: Statement | undefined;

  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    uniqueId: string,
    parameters: string[],
    returnValue: Statement | undefined
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      TypeEnum.FUNCTION,
      uniqueId
    );
    this._parameters = parameters;
    this._returnValue = returnValue;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.deltaMutationProbability)) {
      // 80%
      return new ArrowFunctionStatement(
        this.variableIdentifier,
        this.typeIdentifier,
        this.name,
        prng.uniqueId(),
        this._parameters,
        this.returnValue
          ? this._returnValue.mutate(sampler, depth + 1)
          : undefined
      );
    } else {
      // 20%
      if (prng.nextBoolean(0.5)) {
        // 50%
        return sampler.sampleArgument(
          depth,
          this.variableIdentifier,
          this.name
        );
      } else {
        // 50%
        return sampler.sampleArrowFunction(
          depth,
          this.variableIdentifier,
          this.typeIdentifier,
          this.name
        );
      }
    }
  }

  copy(): ArrowFunctionStatement {
    return new ArrowFunctionStatement(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.uniqueId,
      this._parameters,
      this._returnValue
    );
  }

  decode(context: ContextBuilder): Decoding[] {
    if (this._returnValue === undefined) {
      return [
        {
          decoded: `const ${context.getOrCreateVariableName(
            this
          )} = (${this._parameters.join(", ")}) => {};`,
          reference: this,
        },
      ];
    }

    const returnStatement: Decoding[] = this._returnValue.decode(context);

    const decoded = `const ${context.getOrCreateVariableName(
      this
    )} = (${this._parameters.join(
      ", "
    )}) => { return ${context.getOrCreateVariableName(this.returnValue)} };`;

    return [
      ...returnStatement,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }

  getChildren(): Statement[] {
    if (this._returnValue === undefined) {
      return [];
    }
    return [this.returnValue];
  }

  hasChildren(): boolean {
    return this._returnValue !== undefined;
  }

  setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new Error("Invalid new child!");
    }

    if (index !== 0) {
      throw new Error(shouldNeverHappen(`Invalid index used index: ${index}`));
    }

    this._returnValue = newChild;
  }

  get returnValue(): Statement {
    return this._returnValue;
  }
}
