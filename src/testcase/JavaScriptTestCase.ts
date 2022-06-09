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
  getUserInterface,
  Encoding,
  Decoder, Properties,
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "./sampling/JavaScriptTestCaseSampler";
import { RootStatement } from "./statements/root/RootStatement";

/**
 * JavaScriptTestCase class
 *
 * @author Dimitri Stallenberg
 */
export class JavaScriptTestCase extends Encoding {
  private _root: RootStatement;

  /**
   * Constructor.
   *
   * @param root The root of the tree chromosome of the test case
   */
  constructor(root: RootStatement) {
    super();
    this._root = root;
  }

  mutate(sampler: JavaScriptTestCaseSampler) {
    getUserInterface().debug(`Mutating test case: ${this._id}`);
    if (Properties.resample_gene_probability) {
      return sampler.sample()
    } else {
      return new JavaScriptTestCase(
        this._root.mutate(sampler, 0)
      );
    }
  }

  hashCode(decoder: Decoder<Encoding, string>): number {
    const string = decoder.decode(this, `${this.id}`);
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      const character = string.charCodeAt(i);
      hash = (hash << 5) - hash + character;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  copy(): JavaScriptTestCase {
    return new JavaScriptTestCase(this.root.copy());
  }

  getLength(): number {
    return this.root.getChildren().length;
  }

  get root(): RootStatement {
    return this._root;
  }
}
