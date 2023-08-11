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
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    type: string,
    uniqueId: string,
    value: string,
    alphabet: string,
    maxlength: number
  ) {
    super(variableIdentifier, typeIdentifier, name, type, uniqueId, value);
    this._classType = "StringStatement";

    this.alphabet = alphabet;
    this.maxlength = maxlength;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.deltaMutationProbability)) {
      // 80%
      if (this.value.length > 0 && this.value.length < this.maxlength) {
        const value = prng.nextInt(0, 3);

        switch (value) {
          case 0: {
            // 25%
            return this.addMutation();
          }
          case 1: {
            // 25%
            return this.removeMutation();
          }
          case 2: {
            // 25%
            return this.replaceMutation();
          }
          default: {
            // 25%
            return this.deltaMutation();
          }
        }
      } else if (this.value.length > 0) {
        const value = prng.nextInt(0, 2);

        if (value === 0) {
          // 33%
          return this.removeMutation();
        } else if (value === 1) {
          // 33%
          return this.replaceMutation();
        } else {
          // 33%
          return this.deltaMutation();
        }
      } else {
        // 100%
        return this.addMutation();
      }
    } else {
      // 20%
      if (prng.nextBoolean(0.5)) {
        // 50%
        return sampler.sampleArgument(
          depth + 1,
          this.variableIdentifier,
          this.name
        );
      } else {
        // 50%
        return sampler.sampleString(this.variableIdentifier, this.name);
      }
    }
  }

  addMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length);
    const addedChar = prng.pickOne([...this.alphabet]);

    const newValue = [...this.value];
    newValue.splice(position, 0, addedChar);

    return new StringStatement(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue.join(""),
      this.alphabet,
      this.maxlength
    );
  }

  removeMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length - 1);

    const newValue = [...this.value];
    newValue.splice(position, 1);

    return new StringStatement(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue.join(""),
      this.alphabet,
      this.maxlength
    );
  }

  replaceMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length - 1);
    const newChar = prng.pickOne([...this.alphabet]);

    const newValue = [...this.value];
    newValue.splice(position, 1, newChar);

    return new StringStatement(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue.join(""),
      this.alphabet,
      this.maxlength
    );
  }

  deltaMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length - 1);
    const oldChar = this.value[position];
    const indexOldChar = this.alphabet.indexOf(oldChar);
    let delta = Number(prng.nextGaussian(0, 3).toFixed(0));
    if (delta === 0) {
      delta = prng.nextBoolean() ? 1 : -1;
    }

    let newIndex = indexOldChar + delta;
    if (newIndex < 0) {
      newIndex = this.alphabet.length + newIndex;
    }
    newIndex = newIndex % this.alphabet.length;
    // const delta = prng.pickOne([-2, -1, 1, -2]);
    const newChar = this.alphabet[newIndex];

    const newValue = [...this.value];
    newValue.splice(position, 1, newChar);

    return new StringStatement(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      prng.uniqueId(),
      newValue.join(""),
      this.alphabet,
      this.maxlength
    );
  }

  copy(): StringStatement {
    return new StringStatement(
      this.variableIdentifier,
      this.typeIdentifier,
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

    value = value.replaceAll(/\\/g, "\\\\");
    value = value.replaceAll(/\n/g, "\\n");
    value = value.replaceAll(/\r/g, "\\r");
    value = value.replaceAll(/\t/g, "\\t");
    value = value.replaceAll(/"/g, '\\"');

    return [
      {
        decoded: `const ${this.varName} = "${value}";`,
        reference: this,
      },
    ];
  }
}
