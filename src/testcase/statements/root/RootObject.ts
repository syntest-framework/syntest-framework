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
export class RootObject extends RootStatement {


  /**
   * Constructor
   * @param type the return identifierDescription of the constructor
   * @param uniqueId optional argument
   * @param calls the child calls on the object
   */
  constructor(
    identifierDescription: IdentifierDescription,
    type: string,
    uniqueId: string,
    calls: Statement[],
  ) {
    super(identifierDescription, type, uniqueId, [], calls);
    this._classType = 'RootObject'

    for (const call of calls) {
      if (!(call instanceof MethodCall)) {
        throw new Error("Constructor children must be of identifierDescription MethodCall")
      }
    }
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): RootObject {
    // TODO replace entire constructor?
    const calls = [...this.children.map((a: Statement) => a.copy())];

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

    return new RootObject(this.identifierDescription, this.type, prng.uniqueId(), finalCalls);
  }

  copy(): RootObject {
    const deepCopyChildren = [...this.children.map((a: Statement) => a.copy())];

    return new RootObject(
      this.identifierDescription,
      this.type,
      this.id,
      deepCopyChildren
    );
  }


  decode(id: string, options: { addLogs: boolean, exception: boolean }): Decoding[] {
    const childStatements: Decoding[] = this.children
      .flatMap((a: MethodCall) => a.decodeWithObject(id, options, this.varName))

    let decoded = `const ${this.varName} = ${this.type}`

    if (options.addLogs) {
      const logDir = path.join(
        Properties.temp_log_directory,
        id,
        this.varName
      )
      decoded += `\nawait fs.writeFileSync('${logDir}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`
    }

    return [
      {
        decoded: decoded,
        reference: this
      },
      ...childStatements
    ]
  }
}
