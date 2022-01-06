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
  prng,
  Parameter,
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { ActionStatement } from "./ActionStatement";
import { Statement } from "../Statement";

/**
 * @author Dimitri Stallenberg
 */
export class MethodCall extends ActionStatement {
  private readonly _functionName: string;

  /**
   * Constructor
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param functionName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    type: Parameter,
    uniqueId: string,
    functionName: string,
    args: Statement[]
  ) {
    super(type, uniqueId, args);
    this._functionName = functionName;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number) {
    const args = [...this.args.map((a: Statement) => a.copy())];
    if (args.length === 0) return this.copy();

    const index = prng.nextInt(0, args.length - 1);
    args[index] = args[index].mutate(sampler, depth + 1);

    return new MethodCall(
      this.type,
      prng.uniqueId(),
      this.functionName,
      args
    );
  }

  copy() {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];

    return new MethodCall(
      this.type,
      this.id,
      this.functionName,
      deepCopyArgs
    );
  }

  hasChildren(): boolean {
    return !!this.args.length;
  }

  getChildren(): Statement[] {
    return [...this.args];
  }

  get functionName(): string {
    return this._functionName;
  }

  decode(): string {
    throw new Error('Cannot call decode on method calls!')
  }

  decodeWithObject(objectVariable: string): string {
    return `const ${this.varName} = ${objectVariable}.${this.functionName}()`
  }

  decodeErroring(objectVariable: string): string {
    return `await expect(${objectVariable}.${this.functionName}()).to.be.rejectedWith(Error);`;

  }
}
