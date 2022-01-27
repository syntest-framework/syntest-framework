/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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


import { Decoding, Statement } from "../Statement";
import { EncodingSampler, Parameter } from "../../../../../syntest-framework";

/**
 * @author Dimitri Stallenberg
 */
export abstract class PrimitiveStatement<T> extends Statement {
  get value(): T {
    return this._value;
  }
  private _value: any;

  constructor(type: Parameter, uniqueId: string, value: T) {
    super(type, uniqueId);
    this._value = value;
  }

  abstract mutate(
    sampler: EncodingSampler<any>,
    depth: number
  ): PrimitiveStatement<T>;

  abstract copy(): PrimitiveStatement<T>;

  hasChildren(): boolean {
    return false;
  }

  getChildren(): Statement[] {
    return [];
  }

  static getRandom(): PrimitiveStatement<any> {
    throw new Error("Unimplemented function!");
  }

  decode(addLogs: boolean): Decoding[] {
    return [
      {
        decoded: `const ${this.varName} = ${this.value};`,
        reference: this
      }
    ]
  }
}
