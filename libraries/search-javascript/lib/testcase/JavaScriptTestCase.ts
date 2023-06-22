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

import { Decoder, Encoding, prng } from "@syntest/search";
import { getLogger, Logger } from "@syntest/logging";

import { RootStatement } from "./statements/root/RootStatement";
import { JavaScriptTestCaseSampler } from "./sampling/JavaScriptTestCaseSampler";

/**
 * JavaScriptTestCase class
 *
 * @author Dimitri Stallenberg
 */
export class JavaScriptTestCase extends Encoding {
  protected static LOGGER: Logger;

  private _root: RootStatement;

  /**
   * Constructor.
   *
   * @param root The root of the tree chromosome of the test case
   */
  constructor(root: RootStatement) {
    super();
    JavaScriptTestCase.LOGGER = getLogger(JavaScriptTestCase.name);
    this._root = root;
  }

  mutate(sampler: JavaScriptTestCaseSampler): JavaScriptTestCase {
    JavaScriptTestCase.LOGGER.debug(`Mutating test case: ${this._id}`);
    return prng.nextBoolean(sampler.resampleGeneProbability)
      ? sampler.sample()
      : new JavaScriptTestCase(this._root.mutate(sampler, 0));
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
    return <E>(<unknown>new JavaScriptTestCase(this.root.copy()));
  }

  getLength(): number {
    return this.root.getChildren().length;
  }

  get root(): RootStatement {
    return this._root;
  }
}
