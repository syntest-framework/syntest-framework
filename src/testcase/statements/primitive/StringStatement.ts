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

import {
  prng,
  Properties,
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { PrimitiveStatement } from "./PrimitiveStatement";
import { Decoding } from "../Statement";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";

/**
 * @author Dimitri Stallenberg
 */
export class StringStatement extends PrimitiveStatement<string> {

  private readonly alphabet: string;
  private readonly maxlength: number;

  constructor(
    identifierDescription: IdentifierDescription,
    type: string,
    uniqueId: string,
    value: string,
    alphabet: string,
    maxlength: number
  ) {
    super(identifierDescription, type, uniqueId, value);
    this._classType = 'StringStatement'

    this.alphabet = alphabet;
    this.maxlength = maxlength;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): StringStatement {
    if (prng.nextBoolean(Properties.resample_gene_probability)) {
      return sampler.sampleString(this.identifierDescription, this.type, this.alphabet, this.maxlength);
    }

    if (this.value.length > 0 && this.value.length < this.maxlength) {
      const value = prng.nextInt(0, 3);

      if (value === 0) {
        return this.addMutation();
      } else if (value === 1) {
        return this.removeMutation();
      } else if (value === 2) {
        return this.replaceMutation();
      } else {
        return this.deltaMutation();
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
    const addedChar = prng.pickOne(this.alphabet);

    let newValue = "";

    for (let i = 0; i < this.value.length; i++) {
      if (i < position || i > position) {
        newValue += this.value[i];
      } else {
        newValue += addedChar;
        newValue += this.value[i];
      }
    }

    return new StringStatement(
      this.identifierDescription,
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

    for (let i = 0; i < this.value.length; i++) {
      if (i === position) {
        continue;
      }
      newValue += this.value[i];
    }

    return new StringStatement(
      this.identifierDescription,
      this.type,
      prng.uniqueId(),
      newValue,
      this.alphabet,
      this.maxlength
    );
  }

  replaceMutation(): StringStatement {
    const position = prng.nextInt(0, this.value.length - 1);
    const newChar = prng.pickOne(this.alphabet);

    let newValue = "";

    for (let i = 0; i < this.value.length; i++) {
      if (i < position || i > position) {
        newValue += this.value[i];
      } else {
        newValue += newChar;
      }
    }

    return new StringStatement(
      this.identifierDescription,
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

    for (let i = 0; i < this.value.length; i++) {
      if (i < position || i > position) {
        newValue += this.value[i];
      } else {
        newValue += newChar;
      }
    }

    return new StringStatement(
      this.identifierDescription,
      this.type,
      prng.uniqueId(),
      newValue,
      this.alphabet,
      this.maxlength
    );
  }

  copy(): StringStatement {
    return new StringStatement(
      this.identifierDescription,
      this.type,
      this.id,
      this.value,
      this.alphabet,
      this.maxlength
    );
  }

  decode(id: string, options: { addLogs: boolean, exception: boolean }): Decoding[] {
    return [
      {
        decoded: `const ${this.varName} = "${this.value}";`,
        reference: this
      }
    ]
  }

  getFlatTypes(): string[] {
    return ["string"]
  }
}
