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

import { prng, Properties } from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { RootStatement } from "./RootStatement";
import { Decoding, Statement } from "../Statement";
import { MethodCall } from "../action/MethodCall";
import * as path from "path";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";
import { JavaScriptSubject } from "../../../search/JavaScriptSubject";
import { ActionType } from "../../../analysis/static/parsing/ActionType";

/**
 * @author Dimitri Stallenberg
 */
export class ConstructorCall extends RootStatement {

  private readonly _constructorName: string;

  /**
   * Constructor
   * @param type the return identifierDescription of the constructor
   * @param uniqueId optional argument
   * @param args the arguments of the constructor
   * @param calls the child calls on the object
   * @param constructorName the name of the constructor
   */
  constructor(
    identifierDescription: IdentifierDescription,
    type: string,
    uniqueId: string,
    args: Statement[],
    calls: Statement[],
    constructorName: string,
  ) {
    super(identifierDescription, type, uniqueId, args, calls);
    this._classType = 'ConstructorCall'

    this._constructorName = constructorName;

    for (const arg of args) {
      if (arg instanceof MethodCall) {
        throw new Error("Constructor args cannot be of identifierDescription MethodCall")
      }
    }

    for (const call of calls) {
      if (!(call instanceof MethodCall)) {
        throw new Error("Constructor children must be of identifierDescription MethodCall")
      }
    }
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): ConstructorCall {
    // TODO replace entire constructor?
    const args = [...this.args.map((a: Statement) => a.copy())];
    const calls = [...this.children.map((a: Statement) => a.copy())];

    if (args.length !== 0) {
      // go over each arg
      for (let i = 0; i < args.length; i++) {
        if (prng.nextBoolean(1 / args.length)) {
          if (prng.nextBoolean(Properties.resample_gene_probability)) { // TODO should be different property
            args[i] = sampler.sampleArgument(depth + 1, args[i].identifierDescription)
          } else {
            args[i] = args[i].mutate(sampler, depth + 1);
          }
        }
      }
    }

    const methodsAvailable = !!(<JavaScriptSubject>sampler.subject).getPossibleActions(ActionType.METHOD).length

    const finalCalls = []
    if (calls.length === 0 && methodsAvailable) {
      // add a call
      finalCalls.push(sampler.sampleMethodCall(depth + 1))
    } else {
      // go over each call
      for (let i = 0; i < calls.length; i++) {
        if (prng.nextBoolean(1 / calls.length)) {
          // Mutate this position
          const choice = prng.nextDouble()

          if (choice < 0.1 && methodsAvailable) {
            // 10% chance to add a call on this position
            finalCalls.push(sampler.sampleMethodCall(depth + 1))
            finalCalls.push(calls[i])
          } else if (choice < 0.2) {
            // 10% chance to delete the call
          } else {
            // 80% chance to just mutate the call
            if (Properties.resample_gene_probability) {
              finalCalls.push(sampler.sampleMethodCall(depth + 1))
            } else {
              finalCalls.push(calls[i].mutate(sampler, depth + 1))
            }
          }
        }
      }
    }

    // if (args.length > 0) {
    //   const index = prng.nextInt(0, args.length - 1);
    //   if (args[index] !== undefined)
    //     args[index] = args[index].mutate(sampler, depth + 1);
    // }

    return new ConstructorCall(this.identifierDescription, this.type, prng.uniqueId(), args, finalCalls, this.constructorName);
  }

  copy(): ConstructorCall {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];
    const deepCopyChildren = [...this.children.map((a: Statement) => a.copy())];

    return new ConstructorCall(
      this.identifierDescription,
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

  decode(addLogs: boolean): Decoding[] {
    const args = this.args
      .map((a) => a.varName)
      .join(", ");

    const argStatements: Decoding[] = this.args
      .flatMap((a) => a.decode(addLogs))

    const childStatements: Decoding[] = this.children
      .flatMap((a: MethodCall) => a.decodeWithObject(addLogs, this.varName))

    let decoded = `const ${this.varName} = new ${this.constructorName}(${args})`

    if (addLogs) {
      const logDir = path.join(
        Properties.temp_log_directory,
        // testCase.id,
        this.varName
      )
      decoded += `\nawait fs.writeFileSync('${logDir}', '' + ${this.varName})`
    }

    return [
      ...argStatements,
      {
        decoded: decoded,
        reference: this
      },
      ...childStatements
    ]
  }
}
