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

import { getLogger, Logger } from "@syntest/logging";
import { prng } from "@syntest/prng";
import { Decoder, Encoding } from "@syntest/search";

import { AssertionDataTestCase } from "./execution/AssertionData";
import { JavaScriptTestCaseSampler } from "./sampling/JavaScriptTestCaseSampler";
import { StatementPool } from "./StatementPool";
import { ActionStatement } from "./statements/action/ActionStatement";

/**
 * JavaScriptTestCase class
 */
export class JavaScriptTestCase extends Encoding {
  protected static LOGGER: Logger;

  private _roots: ActionStatement[];

  private _statementPool: StatementPool;

  private _assertionData: AssertionDataTestCase | undefined;

  /**
   * Constructor.
   *
   * @param roots The roots of the tree chromosome of the test case
   */
  constructor(roots: ActionStatement[]) {
    super();
    JavaScriptTestCase.LOGGER = getLogger(JavaScriptTestCase.name);
    this._roots = roots.map((value) => value.copy());

    if (roots.length === 0) {
      throw new Error("Requires atleast one root action statement");
    }

    this._statementPool = new StatementPool(roots);
  }

  mutate(sampler: JavaScriptTestCaseSampler): JavaScriptTestCase {
    JavaScriptTestCase.LOGGER.debug(`Mutating test case: ${this._id}`);
    sampler.statementPool = this._statementPool;
    const roots = this._roots.map((action) => action.copy());

    const choice = prng.nextDouble();

    if (roots.length > 1) {
      if (choice < 0.33) {
        // 33% chance to add a root on this position
        const index = prng.nextInt(0, roots.length);
        roots.splice(index, 0, sampler.sampleRoot());
      } else if (choice < 0.66) {
        // 33% chance to delete the root
        const index = prng.nextInt(0, roots.length - 1);
        roots.splice(index, 1);
      } else {
        // 33% chance to just mutate the root
        const index = prng.nextInt(0, roots.length - 1);
        roots.splice(index, 1, roots[index].mutate(sampler, 1));
      }
    } else {
      if (choice < 0.5) {
        // 50% chance to add a root on this position
        const index = prng.nextInt(0, roots.length);
        roots.splice(index, 0, sampler.sampleRoot());
      } else {
        // 50% chance to just mutate the root
        const index = prng.nextInt(0, roots.length - 1);
        roots.splice(index, 1, roots[index].mutate(sampler, 1));
      }
    }

    sampler.statementPool = undefined;

    return new JavaScriptTestCase(roots);
  }

  hashCode(decoder: Decoder<Encoding, string>): number {
    const string = decoder.decode(this);
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
    return this._roots.map((value) => value.copy());
  }

  get assertionData(): AssertionDataTestCase {
    return this._assertionData;
  }

  set assertionData(data: AssertionDataTestCase) {
    this._assertionData = data;
  }
}
