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
import { shouldNeverHappen } from "@syntest/search";

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
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    type: string,
    uniqueId: string,
    children: Statement[]
  ) {
    super(variableIdentifier, typeIdentifier, name, type, uniqueId);
    this._children = children;
    this._classType = "ArrayStatement";

    // check for circular
    for (const [index, statement] of this._children.entries()) {
      if (statement && statement.uniqueId === this.uniqueId) {
        console.log("circular detected");
        this._children.splice(index, 1);
      }
    }
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.deltaMutationProbability)) {
      const children = this._children.map((a: Statement) => a.copy());

      const choice = prng.nextDouble();

      if (children.length > 0) {
        if (choice < 0.33) {
          // 33% chance to add a child on this position
          const index = prng.nextInt(0, children.length);
          children.splice(
            index,
            0,
            sampler.sampleArrayArgument(depth + 1, this.typeIdentifier, index)
          );
        } else if (choice < 0.66) {
          // 33% chance to remove a child on this position
          const index = prng.nextInt(0, children.length - 1);
          children.splice(index, 1);
        } else {
          // 33% chance to mutate a child on this position
          const index = prng.nextInt(0, children.length - 1);
          children.splice(
            index,
            1,
            sampler.sampleArrayArgument(depth + 1, this.typeIdentifier, index)
          );
        }
      } else {
        // no children found so we always add
        children.push(
          sampler.sampleArrayArgument(depth + 1, this.typeIdentifier, 0)
        );
      }

      return new ArrayStatement(
        this.variableIdentifier,
        this.typeIdentifier,
        this.name,
        this.type,
        prng.uniqueId(),
        children
      );
    } else {
      if (prng.nextBoolean(0.5)) {
        // 50%
        return sampler.sampleArgument(
          depth,
          this.variableIdentifier,
          this.name
        );
      } else {
        // 50%
        return sampler.sampleArray(
          depth,
          this.variableIdentifier,
          this.name,
          this.type
        );
      }
    }
  }

  copy(): ArrayStatement {
    return new ArrayStatement(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      this.uniqueId,
      this._children
        .filter((a) => {
          if (a.uniqueId === this.uniqueId) {
            console.log("circular detected");
            return false;
          }
          return true;
        })
        .map((a) => a.copy())
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

    if (index < 0 || index >= this.children.length) {
      throw new Error(shouldNeverHappen(`Invalid index used index: ${index}`));
    }

    this.children[index] = newChild;
  }

  protected get children(): Statement[] {
    return this._children;
  }
}
