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

import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

import { PrimitiveStatement } from "./PrimitiveStatement";

/**
 * @author Dimitri Stallenberg
 */
export class StringStatement extends PrimitiveStatement<string> {
  private readonly alphabet: string;
  private readonly maxlength: number;

  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    value: string,
    alphabet: string,
    maxlength: number
  ) {
    super(id, name, type, uniqueId, value);
    this._classType = "StringStatement";

    this.alphabet = alphabet;
    this.maxlength = maxlength;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleArgument(depth + 1, this.id, this.name);
    }

    if (this.value.length > 0 && this.value.length < this.maxlength) {
      const value = prng.nextInt(0, 3);

      switch (value) {
        case 0: {
          return this.addMutation();
        }
        case 1: {
          return this.removeMutation();
        }
        case 2: {
          return this.replaceMutation();
        }
        default: {
          return this.deltaMutation();
        }
      }
    } else if (this.value.length > 0) {
      const value = prng.nextInt(0, 2);

      if (value === 0) {
        return this.removeMutation();
      } else if (value === 1) {
        return this.replaceMutation();
      } else {
        return this.deltaMutation();
      }
    } else {
      return this.addMutation();
    }
  }

  addMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length - 1);
    const addedChar = prng.pickOne([...this.alphabet]);

    let newValue = "";

    for (let index = 0; index < this.value.length; index++) {
      if (index < position || index > position) {
        newValue += this.value[index];
      } else {
        newValue += addedChar;
        newValue += this.value[index];
      }
    }

    return new StringStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue,
      this.alphabet,
      this.maxlength
    );
  }

  removeMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length - 1);

    let newValue = "";

    for (let index = 0; index < this.value.length; index++) {
      if (index === position) {
        continue;
      }
      newValue += this.value[index];
    }

    return new StringStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue,
      this.alphabet,
      this.maxlength
    );
  }

  replaceMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length - 1);
    const newChar = prng.pickOne([...this.alphabet]);

    let newValue = "";

    for (let index = 0; index < this.value.length; index++) {
      newValue +=
        index < position || index > position ? this.value[index] : newChar;
    }

    return new StringStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue,
      this.alphabet,
      this.maxlength
    );
  }

  deltaMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length - 1);
    const oldChar = this.value[position];
    const indexOldChar = this.alphabet.indexOf(oldChar);
    const delta = prng.pickOne([-2, -1, 1, -2]);
    const newChar =
      this.alphabet[(indexOldChar + delta) % this.alphabet.length];

    let newValue = "";

    for (let index = 0; index < this.value.length; index++) {
      newValue +=
        index < position || index > position ? this.value[index] : newChar;
    }

    return new StringStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue,
      this.alphabet,
      this.maxlength
    );
  }

  copy(): StringStatement {
    return new StringStatement(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      this.value,
      this.alphabet,
      this.maxlength
    );
  }

  override decode(): Decoding[] {
    let value = this.value;
    value = value.replace(/\n/g, "\\n");
    value = value.replace(/\r/g, "\\r");
    value = value.replace(/\t/g, "\\t");
    value = value.replace(/"/g, '\\"');
    return [
      {
        decoded: `const ${this.varName} = "${value}";`,
        reference: this,
      },
    ];
  }

  getFlatTypes(): string[] {
    return ["string"];
  }
}
