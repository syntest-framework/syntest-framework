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

import { Encoding, EncodingSampler } from "@syntest/search";

import { Statement } from "../Statement";

/**
 * @author Dimitri Stallenberg
 */
export abstract class ActionStatement extends Statement {
  private _args: Statement[];

  protected constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    arguments_: Statement[]
  ) {
    super(id, name, type, uniqueId);
    this._args = arguments_;
  }

  abstract override mutate(
    sampler: EncodingSampler<Encoding>,
    depth: number
  ): ActionStatement;

  abstract override copy(): ActionStatement;

  setChild(index: number, newChild: Statement) {
    this.args[index] = newChild;
  }

  hasChildren(): boolean {
    return this._args.length > 0;
  }

  getChildren(): Statement[] {
    return [...this._args];
  }

  get args(): Statement[] {
    return this._args;
  }

  getFlatTypes(): string[] {
    return this.args.flatMap((a) => a.getFlatTypes());
  }
}
