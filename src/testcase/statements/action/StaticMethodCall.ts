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
  prng, Properties,
} from "@syntest/framework";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { ActionStatement } from "./ActionStatement";
import { Decoding, Statement } from "../Statement";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";


// TODO maybe delete?
/**
 * @author Dimitri Stallenberg
 */
export class StaticMethodCall extends ActionStatement {

  private readonly _functionName: string;

  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param args the arguments of the function
   * @param functionName the name of the function
   */
  constructor(
    identifierDescription: IdentifierDescription,
    type: string,
    uniqueId: string,
    args: Statement[],
    functionName: string
  ) {
    super(identifierDescription, type, uniqueId, args);
    this._classType = 'StaticMethodCall'

    this._functionName = functionName;
  }

  mutate(sampler: JavaScriptTestCaseSampler, depth: number): StaticMethodCall {
    const args = [...this.args.map((a: Statement) => a.copy())];

    if (args.length != 0) {
      // randomly mutate one of the args
      const index = prng.nextInt(0, args.length - 1);
      if (prng.nextBoolean(Properties.resample_gene_probability)) { // TODO should be different property
        args[index] = sampler.sampleArgument(depth + 1, args[index].identifierDescription)
      } else {
        args[index] = args[index].mutate(sampler, depth + 1);
      }
    }

    return new StaticMethodCall(this.identifierDescription, this.type, prng.uniqueId(), args, this.functionName);
  }

  copy(): StaticMethodCall {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];

    return new StaticMethodCall(
      this.identifierDescription,
      this.type,
      this.id,
      deepCopyArgs,
      this.functionName
    );
  }

  get functionName(): string {
    return this._functionName;
  }

  decode(id: string, options: { addLogs: boolean, exception: boolean }): Decoding[] {
    // TODO
    return [
      {
        decoded: 'TODO',
        reference: this
      }
    ];
  }
}
