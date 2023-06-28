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

import { JavaScriptDecoder } from "../../../testbuilding/JavaScriptDecoder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

/**
 * @author Dimitri Stallenberg
 */
// TODO array subtype
export class ArrayStatement extends Statement {
  private _children: Statement[];

  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    children: Statement[]
  ) {
    super(id, name, type, uniqueId);
    this._children = children;
    this._classType = "ArrayStatement";
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sampleArgument(depth, this.id, this.name);
    }
    const children = this._children.map((a: Statement) => a.copy());

    //
    // if (children.length !== 0) {
    //   const index = prng.nextInt(0, children.length - 1);
    //   if (prng.nextBoolean(Properties.resample_gene_probability)) { // TODO should be different property
    //     children[index] = sampler.sampleArgument(depth + 1, children[index].identifierDescription)
    //   } else {
    //     children[index] = children[index].mutate(sampler, depth + 1);
    //   }
    // }

    const finalChildren = [];

    // If there are no children, add one
    if (children.length === 0) {
      // add a item
      finalChildren.push(sampler.sampleArrayArgument(depth + 1, this.id, 0));

      return new ArrayStatement(
        this.id,
        this.name,
        this.type,
        prng.uniqueId(),
        finalChildren
      );
    }

    // go over each call
    for (let index = 0; index < children.length; index++) {
      if (prng.nextBoolean(1 / children.length)) {
        // Mutate this position
        const choice = prng.nextDouble();

        if (choice < 0.1) {
          // 10% chance to add a argument on this position
          finalChildren.push(
            sampler.sampleArrayArgument(depth + 1, this.id, index),
            children[index]
          );
        } else if (choice < 0.2) {
          // 10% chance to delete the child
        } else {
          // 80% chance to just mutate the child
          finalChildren.push(children[index].mutate(sampler, depth + 1));
        }
      }
    }

    return new ArrayStatement(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      finalChildren
    );
  }

  copy(): ArrayStatement {
    return new ArrayStatement(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      this._children.map((a) => a.copy())
    );
  }

  decode(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean }
  ): Decoding[] {
    const children = this._children.map((a) => a.varName).join(", ");

    const childStatements: Decoding[] = this._children.flatMap((a) =>
      a.decode(decoder, id, options)
    );

    let decoded = `const ${this.varName} = [${children}]`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...childStatements,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }

  getChildren(): Statement[] {
    return [...this.children];
  }

  hasChildren(): boolean {
    return this._children.length > 0;
  }

  setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new Error("Invalid new child!");
    }

    if (index >= this.children.length) {
      throw new Error("Invalid child location!");
    }

    this.children[index] = newChild;
  }

  get children(): Statement[] {
    return this._children;
  }

  getFlatTypes(): string[] {
    return ["array", ...this.children.flatMap((a) => a.getFlatTypes())];
  }
}
