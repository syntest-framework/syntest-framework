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

import { prng, Properties } from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";
import * as path from "path";
import { StringStatement } from "../primitive/StringStatement";
import { TypeProbability } from "../../../analysis/static/types/resolving/TypeProbability";

/**
 * @author Dimitri Stallenberg
 */
// TODO object subtypes (get the current chosen one from the typeprobability map or something
export class ObjectStatement extends Statement {
  private _keys: StringStatement[];
  private _values: Statement[];

  constructor(identifierDescription: IdentifierDescription, type: string, uniqueId: string, keys: StringStatement[], values: Statement[]) {
    super(identifierDescription, type, uniqueId);
    this._keys = keys
    this._values = values
    this._classType = 'ObjectStatement'
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): ObjectStatement {
    const keys = [...this._keys.map((a: Statement) => a.copy())];
    const values = [...this._values.map((a: Statement) => a.copy())];

    //
    // if (children.length !== 0) {
    //   const index = prng.nextInt(0, children.length - 1);
    //   if (prng.nextBoolean(Properties.resample_gene_probability)) { // TODO should be different property
    //     children[index] = sampler.sampleArgument(depth + 1, children[index].identifierDescription)
    //   } else {
    //     children[index] = children[index].mutate(sampler, depth + 1);
    //   }
    // }

    const finalKeys = []
    const finalValues = []

    if (finalKeys.length === 0) {
      // add a child
      const key = sampler.sampleString()
      finalKeys.push(key)
      finalValues.push(sampler.sampleArgument(depth + 1, { name: key.varName, typeProbabilityMap: new TypeProbability() }))
    } else {
      // go over each child
      for (let i = 0; i < finalKeys.length; i++) {
        if (prng.nextBoolean(1 / finalKeys.length)) {
          // Mutate this position
          const choice = prng.nextDouble()

          if (choice < 0.1) {
            // 10% chance to add a call on this position

            // TODO should also look if we can add back one of the deleted ones

            const key = sampler.sampleString()
            finalKeys.push(key)
            finalValues.push(sampler.sampleArgument(depth + 1, { name: key.varName, typeProbabilityMap: new TypeProbability() }))
            finalKeys.push(keys[i])
            finalValues.push(values[i])
          } else if (choice < 0.2) {
            // 10% chance to delete the call
          } else {
            // 80% chance to just mutate the call

            finalKeys.push(keys[i])

            if (Properties.resample_gene_probability) {
              const propertyType = this.identifierDescription.typeProbabilityMap.getPropertyTypes(this.type).get(keys[i].varName)
              finalValues.push(sampler.sampleArgument(depth + 1, {name: keys[i].varName, typeProbabilityMap: propertyType}))
            } else {
              finalValues.push(values[i].mutate(sampler, depth + 1))
            }
          }
        }
      }
    }

    return new ObjectStatement(this.identifierDescription, this.type, prng.uniqueId(), finalKeys, finalValues);
  }

  copy(): ObjectStatement {
    return new ObjectStatement(this.identifierDescription, this.type, this.id, this._keys.map(a => a.copy()), this._values.map(a => a.copy()));
  }

  decode(id: string, options: { addLogs: boolean, exception: boolean }): Decoding[] {
    const children = this._values
      .map((a, i) => `\t"${this._keys[i].value}": ${a.varName}`)
      .join(',\n\t')

    const childStatements: Decoding[] = this._values
      .flatMap((a) => a.decode(id, options))

    let decoded = `const ${this.varName} = {\n${children}\n\t}`

    if (options.addLogs) {
      const logDir = path.join(
        Properties.temp_log_directory,
        id,
        this.varName
      )
      decoded += `\nawait fs.writeFileSync('${logDir}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`
    }

    return [
      ...childStatements,
      {
        decoded: decoded,
        reference: this
      }
    ]
  }

  getChildren(): Statement[] {
    return [...this.children];
  }

  hasChildren(): boolean {
    return !!this._keys.length;
  }

  setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new Error("Invalid new child!")
    }

    if (index >= this.children.length) {
      throw new Error("Invalid child location!")
    }

    this.children[index] = newChild
  }

  get children(): Statement[] {
    return this._values;
  }

  getFlatTypes(): string[] {
    return [
      "object",
      ...this.children.flatMap((a) => a.getFlatTypes())
    ]
  }
}
