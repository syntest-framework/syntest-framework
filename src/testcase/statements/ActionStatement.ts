/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { Statement } from "./Statement";
import { EncodingSampler } from "../../search/EncodingSampler";
import { Parameter } from "../../analysis/static/graph/parsing/Parameter";
import { Encoding } from "../../search/Encoding";

/**
 * @author Dimitri Stallenberg
 */
export abstract class ActionStatement extends Statement {
  get args(): Statement[] {
    return this._args;
  }

  set args(value: Statement[]) {
    this._args = value;
  }
  private _args: Statement[];

  protected constructor(
    types: Parameter[],
    uniqueId: string,
    args: Statement[]
  ) {
    super(types, uniqueId);
    this._args = args;
  }

  abstract mutate(
    sampler: EncodingSampler<Encoding>,
    depth: number
  ): ActionStatement;

  abstract copy(): ActionStatement;

  hasChildren(): boolean {
    return !!this._args.length;
  }

  getChildren(): Statement[] {
    return [...this._args];
  }

  setChild(index: number, child: Statement) {
    this._args[index] = child;
  }
}
