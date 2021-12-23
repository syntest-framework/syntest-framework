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
  Parameter
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { RootStatement } from "./RootStatement";
import { Statement } from "../Statement";
import { PrimitiveStatement } from "../primitive/PrimitiveStatement";

/**
 * @author Dimitri Stallenberg
 */
export class ConstructorCall extends RootStatement {

  private readonly _constructorName: string;

  /**
   * Constructor
   * @param type the return type of the constructor
   * @param uniqueId optional argument
   * @param args the arguments of the constructor
   * @param calls the child calls on the object
   * @param constructorName the name of the constructor
   */
  constructor(
    type: Parameter,
    uniqueId: string,
    args: Statement[],
    calls: Statement[],
    constructorName: string,
  ) {
    super(type, uniqueId, args, calls);
    this._constructorName = constructorName;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number) {
    // TODO replace entire constructor?

    const args = [...this.args.map((a: Statement) => a.copy())];
    const calls = [...this.children.map((a: Statement) => a.copy())];

    if (args.length !== 0) {
      // go over each arg
      for (let i = 0; i < args.length; i++) {
        if (prng.nextBoolean(1 / args.length)) {
          args[i] = args[i].mutate(sampler, depth + 1)
        }
      }
    }

    const finalCalls = []
    if (calls.length === 0) {
      // add a call
      finalCalls.push(sampler.sampleMethodCall(depth + 1))
    } else {
      // go over each call
      for (let i = 0; i < calls.length; i++) {
        if (prng.nextBoolean(1 / calls.length)) {
          // Mutate this position
          const choice = prng.nextDouble()
          if (choice < 0.1) {
            // 10% chance to add a call on this position
            finalCalls.push(sampler.sampleMethodCall(depth + 1))
            finalCalls.push(calls[i])
          } else if (choice < 0.1) {
            // 10% chance to delete the call
          } else if (choice < 0.3) {
            // 30% chance to replace the call
            finalCalls.push(sampler.sampleMethodCall(depth + 1))
          } else {
            // 50% chance to just mutate the call
            finalCalls.push(calls[i].mutate(sampler, depth + 1))
          }
        }
      }
    }

    // if (args.length > 0) {
    //   const index = prng.nextInt(0, args.length - 1);
    //   if (args[index] !== undefined)
    //     args[index] = args[index].mutate(sampler, depth + 1);
    // }

    return new ConstructorCall(this.type, this.id, args, finalCalls, this.constructorName);
  }

  copy() {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];
    const deepCopyChildren = [...this.children.map((a: Statement) => a.copy())];

    return new ConstructorCall(
      this.type,
      this.id,
      deepCopyArgs,
      deepCopyChildren,
      this.constructorName
    );
  }

  get constructorName(): string {
    return this._constructorName;
  }

  decode(): string {
    const formattedArgs = this.args
      .map((a: PrimitiveStatement<any>) => a.varName)
      .join(", ");

    return (
      `const ${this.varName} = new ${this.constructorName}(${formattedArgs})`
    )
  }
}
