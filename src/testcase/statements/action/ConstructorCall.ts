/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Solidity.
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
  Statement,
  ActionStatement,
  prng,
  Parameter,
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";

/**
 * @author Dimitri Stallenberg
 */
export class ConstructorCall extends ActionStatement {
  get constructorName(): string {
    return this._constructorName;
  }

  private readonly _constructorName: string;

  /**
   * Constructor
   * @param types the return types of the constructor
   * @param uniqueId optional argument
   * @param constructorName the name of the constructor
   * @param args the arguments of the constructor
   */
  constructor(
    types: Parameter[],
    uniqueId: string,
    constructorName: string,
    args: Statement[]
  ) {
    super(types, uniqueId, args);
    this._constructorName = constructorName;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number) {
    const args = [...this.args.map((a: Statement) => a.copy())];

    if (args.length > 0) {
      const index = prng.nextInt(0, args.length - 1);
      if (args[index] !== undefined)
        args[index] = args[index].mutate(sampler, depth + 1);
    }

    return new ConstructorCall(this.types, this.id, this.constructorName, args);
  }

  copy() {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];

    return new ConstructorCall(
      this.types,
      this.id,
      this.constructorName,
      deepCopyArgs
    );
  }
}
