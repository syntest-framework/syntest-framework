/*
 * Copyright 2020-2023 SynTest contributors
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
import { IllegalArgumentError } from "@syntest/diagnostics";
import { prng } from "@syntest/prng";

import { ContextBuilder } from "../../../testbuilding/ContextBuilder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

export class ArrayStatement extends Statement {
  private _elements: Statement[];

  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    uniqueId: string,
    elements: Statement[]
  ) {
    super(variableIdentifier, typeIdentifier, name, TypeEnum.ARRAY, uniqueId);
    this._elements = elements;

    // check for circular
    for (const [index, statement] of this._elements.entries()) {
      if (statement && statement.uniqueId === this.uniqueId) {
        this._elements.splice(index, 1);
      }
    }
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): Statement {
    if (prng.nextBoolean(sampler.deltaMutationProbability)) {
      const children = this._elements.map((a: Statement) => a.copy());

      const choice = prng.nextDouble();

      if (children.length > 0) {
        if (choice < 0.33) {
          // 33% chance to add a child on this position
          const index = prng.nextInt(0, children.length);
          children.splice(
            index,
            0,
            sampler.sampleArrayArgument(depth + 1, this.typeIdentifier)
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
            sampler.sampleArrayArgument(depth + 1, this.typeIdentifier)
          );
        }
      } else {
        // no children found so we always add
        children.push(
          sampler.sampleArrayArgument(depth + 1, this.typeIdentifier)
        );
      }

      return new ArrayStatement(
        this.variableIdentifier,
        this.typeIdentifier,
        this.name,
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
          this.typeIdentifier,
          this.name
        );
      }
    }
  }

  copy(): ArrayStatement {
    return new ArrayStatement(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.uniqueId,
      this._elements
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

  decode(context: ContextBuilder): Decoding[] {
    const elementStatements: Decoding[] = this._elements.flatMap((a) =>
      a.decode(context)
    );

    const elements = this._elements
      .map((a) => context.getOrCreateVariableName(a))
      .join(", ");

    const decoded = `const ${context.getOrCreateVariableName(
      this
    )} = [${elements}]`;

    return [
      ...elementStatements,
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
    return this._elements.length > 0;
  }

  setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new IllegalArgumentError("Invalid new child!");
    }

    if (index < 0 || index >= this.children.length) {
      throw new IllegalArgumentError("Child index is not within range", {
        context: {
          index: index,
          range: `0 >= index < ${this.children.length}`,
        },
      });
    }

    this.children[index] = newChild;
  }

  protected get children(): Statement[] {
    return this._elements;
  }
}
