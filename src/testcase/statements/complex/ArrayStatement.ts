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
import { TypeProbability } from "../../../analysis/static/types/resolving/TypeProbability";

/**
 * @author Dimitri Stallenberg
 */
// TODO array subtype
export class ArrayStatement extends Statement {
  private _children: Statement[];

  constructor(identifierDescription: IdentifierDescription, type: string, uniqueId: string, children: Statement[]) {
    super(identifierDescription, type, uniqueId);
    this._children = children
    this._classType = 'ArrayStatement'
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): ArrayStatement {
    const children = [...this._children.map((a: Statement) => a.copy())];
    //
    // if (children.length !== 0) {
    //   const index = prng.nextInt(0, children.length - 1);
    //   if (prng.nextBoolean(Properties.resample_gene_probability)) { // TODO should be different property
    //     children[index] = sampler.sampleArgument(depth + 1, children[index].identifierDescription)
    //   } else {
    //     children[index] = children[index].mutate(sampler, depth + 1);
    //   }
    // }

    const finalChildren = []

    if (children.length === 0) {
      // add a call
      finalChildren.push(sampler.sampleArgument(depth + 1, { name: 'arrayValue', typeProbabilityMap: new TypeProbability() }))
    } else {
      // go over each call
      for (let i = 0; i < children.length; i++) {
        if (prng.nextBoolean(1 / children.length)) {
          // Mutate this position
          const choice = prng.nextDouble()

          if (choice < 0.1) {
            // 10% chance to add a call on this position
            finalChildren.push(sampler.sampleArgument(depth + 1, { name: 'arrayValue', typeProbabilityMap: new TypeProbability() }))
            finalChildren.push(children[i])
          } else if (choice < 0.2) {
            // 10% chance to delete the child
          } else {
            // 80% chance to just mutate the child
            if (Properties.resample_gene_probability) {
              finalChildren.push(sampler.sampleArgument(depth + 1, { name: 'arrayValue', typeProbabilityMap: new TypeProbability() }))
            } else {
              finalChildren.push(children[i].mutate(sampler, depth + 1))
            }
          }
        }
      }
    }

    return new ArrayStatement(this.identifierDescription, this.type, prng.uniqueId(), finalChildren);
  }

  copy(): ArrayStatement {
    return new ArrayStatement(this.identifierDescription, this.type, this.id, this._children.map(a => a.copy()));
  }

  decode(id: string, options: { addLogs: boolean, exception: boolean }): Decoding[] {
    const children = this._children
      .map((a) => a.varName)
      .join(', ')

    const childStatements: Decoding[] = this._children
      .flatMap((a) => a.decode(id, options))

    let decoded = `const ${this.varName} = [${children}]`

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
    return !!this._children.length;
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
    return this._children;
  }

  getFlatTypes(): string[] {
    return [
      "array",
      ...this.children.flatMap((a) => a.getFlatTypes())
    ]
  }
}
