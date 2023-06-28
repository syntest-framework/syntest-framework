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
import { Getter } from "../action/Getter";
import { MethodCall } from "../action/MethodCall";
import { Setter } from "../action/Setter";
import { Decoding, Statement } from "../Statement";

import { RootStatement } from "./RootStatement";

/**
 * @author Dimitri Stallenberg
 */
export class ConstructorCall extends RootStatement {
  /**
   * Constructor
   * @param type the return identifierDescription of the constructor
   * @param uniqueId optional argument
   * @param args the arguments of the constructor
   * @param calls the child calls on the object
   */
  constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    arguments_: Statement[],
    calls: Statement[]
  ) {
    super(id, name, type, uniqueId, arguments_, calls);
    this._classType = "ConstructorCall";

    for (const argument of arguments_) {
      if (argument instanceof MethodCall) {
        throw new TypeError(
          "Constructor args cannot be of identifierDescription MethodCall"
        );
      }
    }

    for (const call of calls) {
      if (
        !(
          call instanceof MethodCall ||
          call instanceof Getter ||
          call instanceof Setter
        )
      ) {
        throw new TypeError(
          "Constructor children must be of identifierDescription MethodCall, Getter, or Setter"
        );
      }
    }
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): ConstructorCall {
    // TODO replace entire constructor?

    const arguments_ = this.args.map((a: Statement) => a.copy());
    const calls = this.children.map((a: Statement) => a.copy());

    if (arguments_.length > 0) {
      // go over each arg
      for (let index = 0; index < arguments_.length; index++) {
        if (prng.nextBoolean(1 / arguments_.length)) {
          arguments_[index] = arguments_[index].mutate(sampler, depth + 1);
        }
      }
    }

    const methodsAvailable =
      (<JavaScriptSubject>sampler.subject).getActionableTargetsByType(
        TargetType.METHOD
      ).length > 0;

    const finalCalls = [];

    // if there are no calls, add one if there are methods available
    if (calls.length === 0 && methodsAvailable) {
      // add a call
      finalCalls.push(sampler.sampleMethodCall(depth + 1, this.name));
      return new ConstructorCall(
        this.id,
        this.name,
        this.type,
        prng.uniqueId(),
        arguments_,
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
            sampler.sampleMethodCall(depth + 1, this.name),
            calls[index]
          );
        } else if (choice < 0.2) {
          // 10% chance to delete the call
        } else {
          // 80% chance to just mutate the call
          if (sampler.resampleGeneProbability) {
            finalCalls.push(sampler.sampleMethodCall(depth + 1, this.name));
          } else {
            finalCalls.push(calls[index].mutate(sampler, depth + 1));
          }
        }
      }
    }

    return new ConstructorCall(
      this.id,
      this.name,
      this.type,
      prng.uniqueId(),
      arguments_,
      finalCalls
    );
  }

  copy(): ConstructorCall {
    const deepCopyArguments = this.args.map((a: Statement) => a.copy());
    const deepCopyChildren = this.children.map((a: Statement) => a.copy());

    return new ConstructorCall(
      this.id,
      this.name,
      this.type,
      this.uniqueId,
      deepCopyArguments,
      deepCopyChildren
    );
  }

  decode(
    decoder: JavaScriptDecoder,
    id: string,
    options: { addLogs: boolean; exception: boolean }
  ): Decoding[] {
    const arguments_ = this.args.map((a) => a.varName).join(", ");

    const argumentStatements: Decoding[] = this.args.flatMap((a) =>
      a.decode(decoder, id, options)
    );

    const childStatements: Decoding[] = this.children.flatMap((a) =>
      (<MethodCall>a).decodeWithObject(decoder, id, options, this.varName)
    );

    let decoded = `const ${this.varName} = new ${this.name}(${arguments_})`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...argumentStatements,
      {
        decoded: decoded,
        reference: this,
      },
      ...childStatements,
    ];
  }
}
