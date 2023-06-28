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

import { prng } from "@syntest/prng";
import { TargetType } from "@syntest/analysis";

import { JavaScriptSubject } from "../../../search/JavaScriptSubject";
import { JavaScriptDecoder } from "../../../testbuilding/JavaScriptDecoder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

import { RootStatement } from "./RootStatement";
import { ObjectFunctionCall } from "../action/ObjectFunctionCall";

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
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    calls: Statement[]
  ) {
    super(id, name, type, uniqueId, [], calls);
    this._classType = "RootObject";

    for (const call of calls) {
      if (!(call instanceof ObjectFunctionCall)) {
        throw new TypeError(
          "Constructor children must be of identifierDescription MethodCall"
        );
      }
    }
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): RootObject {
    // TODO replace entire constructor?
    const calls = this.children.map((a: Statement) => a.copy());

    const methodsAvailable =
      (<JavaScriptSubject>sampler.subject).getActionableTargetsByType(
        TargetType.METHOD
      ).length > 0;

    const finalCalls = [];

    // If there are no calls, add one if there are methods available
    if (calls.length === 0 && methodsAvailable) {
      // add a call
      finalCalls.push(sampler.sampleObjectFunctionCall(depth + 1, this.name));
      return new RootObject(
        this.id,
        this.name,
        this.type,
        prng.uniqueId(),
        finalCalls
      );
    }

    // go over each call
    for (let index = 0; index < calls.length; index++) {
      if (prng.nextBoolean(1 / calls.length)) {
        // Mutate this position
        const choice = prng.nextDouble();

        if (choice < 0.1 && methodsAvailable) {
          // 10% chance to add a call on this position
          finalCalls.push(
            sampler.sampleObjectFunctionCall(depth + 1, this.name),
            calls[index]
          );
        } else if (choice < 0.2) {
          // 10% chance to delete the call
        } else {
          // 80% chance to just mutate the call
          if (prng.nextBoolean(sampler.resampleGeneProbability)) {
            finalCalls.push(
              sampler.sampleObjectFunctionCall(depth + 1, this.name)
            );
          } else {
            finalCalls.push(calls[index].mutate(sampler, depth + 1));
          }
        }
      }
    }

    return new RootObject(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      finalCalls
    );
  }

  copy(): RootObject {
    const deepCopyChildren = this.children.map((a: Statement) => a.copy());

    return new RootObject(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      deepCopyChildren
    );
  }

  decode(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean }
  ): Decoding[] {
    const childStatements: Decoding[] = this.children.flatMap(
      (a: Statement) => {
        if (a instanceof ObjectFunctionCall) {
          return a.decodeWithObject(decoder, id, options, this.varName);
        }
        return a.decode(decoder, id, options);
      }
    );

    let decoded = `const ${this.varName} = ${this.name}`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      {
        decoded: decoded,
        reference: this,
      },
      ...childStatements,
    ];
  }
}
