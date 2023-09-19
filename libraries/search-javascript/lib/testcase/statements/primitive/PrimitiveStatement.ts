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

import { ContextBuilder } from "../../../testbuilding/ContextBuilder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

/**
 * @author Dimitri Stallenberg
 */
export abstract class PrimitiveStatement<T> extends Statement {
  get value(): T {
    return this._value;
  }
  private _value: T;

  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    type: TypeEnum,
    uniqueId: string,
    value: T
  ) {
    super(variableIdentifier, typeIdentifier, name, type, uniqueId);
    this._value = value;
  }

  abstract override mutate(
    sampler: JavaScriptTestCaseSampler,
    depth: number
  ): Statement;

  abstract override copy(): Statement;

  hasChildren(): boolean {
    return false;
  }

  getChildren(): Statement[] {
    return [];
  }

  setChild(_index: number, _newChild: Statement): void {
    throw new Error("Primitive statements don't have children");
  }

  static getRandom() {
    throw new Error("Unimplemented function!");
  }

  decode(context: ContextBuilder): Decoding[] {
    const asString = String(this.value);
    return [
      {
        decoded: `const ${context.getOrCreateVariableName(
          this
        )} = ${asString};`,
        reference: this,
      },
    ];
  }
}
