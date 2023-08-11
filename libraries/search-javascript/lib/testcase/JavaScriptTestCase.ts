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
import { Decoder, Encoding } from "@syntest/search";
import { getLogger, Logger } from "@syntest/logging";

import { JavaScriptTestCaseSampler } from "./sampling/JavaScriptTestCaseSampler";
import { ActionStatement } from "./statements/action/ActionStatement";
import { StatementPool } from "./StatementPool";

/**
 * JavaScriptTestCase class
 *
 * @author Dimitri Stallenberg
 */
export class JavaScriptTestCase extends Encoding {
  protected static LOGGER: Logger;

  private _roots: ActionStatement[];

  private _statementPool: StatementPool;

  /**
   * Constructor.
   *
   * @param roots The roots of the tree chromosome of the test case
   */
  constructor(roots: ActionStatement[]) {
    super();
    JavaScriptTestCase.LOGGER = getLogger(JavaScriptTestCase.name);
    this._roots = [...roots];

    if (roots.length === 0) {
      throw new Error("Requires atleast one root action statement");
    }

    this._statementPool = new StatementPool(roots);
  }

  mutate(sampler: JavaScriptTestCaseSampler): JavaScriptTestCase {
    JavaScriptTestCase.LOGGER.debug(`Mutating test case: ${this._id}`);
    if (prng.nextBoolean(sampler.resampleGeneProbability)) {
      return sampler.sample();
    }

    sampler.statementPool = this._statementPool;
    const roots = this._roots.map((action) => action.copy());
    const finalRoots = [];

    // go over each call
    for (let index = 0; index < roots.length; index++) {
      if (prng.nextBoolean(1 / roots.length)) {
        // Mutate this position
        const choice = prng.nextDouble();

        if (choice < 0.1) {
          // 10% chance to add a root on this position
          finalRoots.push(sampler.sampleRoot(), roots[index]);
        } else if (
          choice < 0.2 &&
          (roots.length > 1 || finalRoots.length > 0)
        ) {
          // 10% chance to delete the root
        } else {
          // 80% chance to just mutate the root
          finalRoots.push(roots[index].mutate(sampler, 1));
        }
      } else {
        finalRoots.push(roots[index]);
      }
    }
    // add one at the end 10% * (1 / |roots|)
    if (prng.nextBoolean(0.1) && prng.nextBoolean(1 / roots.length)) {
      finalRoots.push(sampler.sampleRoot());
    }

    sampler.statementPool = undefined;

    return new JavaScriptTestCase(finalRoots);
  }

  hashCode(decoder: Decoder<Encoding, string>): number {
    const string = decoder.decode(this, `${this.id}`);
    let hash = 0;
    for (let index = 0; index < string.length; index++) {
      const character = string.codePointAt(index);
      hash = (hash << 5) - hash + character;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  copy<E extends Encoding>(): E {
    return <E>(
      (<unknown>new JavaScriptTestCase(this._roots.map((root) => root.copy())))
    );
  }

  getLength(): number {
    return this.roots.length;
  }

  get roots(): ActionStatement[] {
    return [...this._roots];
  }
}
