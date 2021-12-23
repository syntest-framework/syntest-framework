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


// TODO maybe delete?
/**
 * @author Dimitri Stallenberg
 */
export class StaticMethodCall extends ActionStatement {

  private readonly _functionName: string;

  /**
   * Constructor
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param args the arguments of the function
   * @param functionName the name of the function
   */
  constructor(
    type: Parameter,
    uniqueId: string,
    args: Statement[],
    functionName: string
  ) {
    super(type, uniqueId, args);
    this._functionName = functionName;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number) {
    // if (prng.nextBoolean(Properties.resample_gene_probability)) {
    //   // resample the gene
    //   return sampler.sampleStatement(depth, this.types, "functionCall");
    // } else
    if (!this.args.length) {
      return this.copy();
    } else {
      // randomly mutate one of the args
      const args = [...this.args.map((a: Statement) => a.copy())];
      const index = prng.nextInt(0, args.length - 1);
      args[index] = args[index].mutate(sampler, depth + 1);

      return new StaticMethodCall(this.type, this.id, args, this.functionName);
    }
  }

  copy() {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];

    return new StaticMethodCall(
      this.type,
      this.id,
      deepCopyArgs,
      this.functionName
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
    // TODO
    return "";
  }
}
