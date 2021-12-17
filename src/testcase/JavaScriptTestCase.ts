/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Javascript.
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
  ActionStatement,
  Decoder,
  Encoding, prng,
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "./sampling/JavaScriptTestCaseSampler";

export class JavaScriptTestCase extends Encoding {
  private _root: ActionStatement[];

  /**
   * Constructor.
   *
   * @param root The root of the tree chromosome of the test case
   */
  constructor(root: ActionStatement[]) {
    super();
    this._root = root;
  }

  mutate(sampler: JavaScriptTestCaseSampler) {

    let newRoot: ActionStatement[] = []
    let changed = false;
    if (
      prng.nextBoolean(1 / 10) &&
      this._root.length > 1
    ) {
      newRoot = this.deleteMethodCall();
      changed = true
    }
    if (
      prng.nextBoolean(1 / 10) &&
      !changed
    ) {
      newRoot = this.replaceMethodCall(sampler);
      changed = true
    }
    if (
      prng.nextBoolean(1 / 10) &&
      !changed
    ) {
      newRoot = this.addMethodCall(sampler);
      changed = true
    }

    newRoot = newRoot.map((action) => {
      if (prng.nextBoolean(1 / newRoot.length)) {
        return action.mutate(sampler, 0)
      } else {
        return action.copy()
      }
    })

    return new JavaScriptTestCase(newRoot);
  }


  protected addMethodCall(
    sampler: JavaScriptTestCaseSampler,
  ): ActionStatement[] {
    let newRoot = [...this._root]
    let count = 0;
    // TODO either do one at the time or also have multiple delete/replace
    while (prng.nextBoolean(Math.pow(0.5, count)) && count < 10) {
      const index = prng.nextInt(0, newRoot.length);

      // get a random test case and we extract one of its method call
      newRoot.splice(
        index,
        0,
        sampler.sampleFunctionCall(0)
      );

      count++;
    }

    return newRoot
  }

  protected replaceMethodCall(
    sampler: JavaScriptTestCaseSampler,
  ): ActionStatement[] {
    let newRoot = [...this._root]

    if (newRoot.length) {
      const index = prng.nextInt(0, newRoot.length - 1);
      newRoot[index] = sampler.sampleFunctionCall(0);
    }

    return newRoot
  }

  protected deleteMethodCall(): ActionStatement[] {
    let newRoot = [...this._root]

    if (newRoot.length) {
      const index = prng.nextInt(0, newRoot.length - 1);
      this._root.splice(index, 1);
    }

    return newRoot
  }


  hashCode(decoder: Decoder<Encoding, string>): number {
    return 0;
  }

  copy(): JavaScriptTestCase {
    // TODO
    return undefined;
  }

  getLength(): number {
    // TODO
    return 0;
  }


  get root(): ActionStatement[] {
    return this._root;
  }
}
