/*
 * Copyright 2020-2023 SynTest contributors
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

import { Export, TypeEnum } from "@syntest/analysis-javascript";
import { IllegalArgumentError } from "@syntest/diagnostics";
import { Encoding, EncodingSampler } from "@syntest/search";

import { Statement } from "../Statement";

/**
 * ActionStatement
 */
export abstract class ActionStatement extends Statement {
  private _args: Statement[];
  protected _export?: Export;

  protected constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    ownType: TypeEnum,
    uniqueId: string,
    arguments_: Statement[],
    export_?: Export
  ) {
    super(variableIdentifier, typeIdentifier, name, ownType, uniqueId);
    this._args = arguments_;
    this._export = export_;
  }

  abstract override mutate(
    sampler: EncodingSampler<Encoding>,
    depth: number
  ): ActionStatement;

  abstract override copy(): ActionStatement;

  setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new IllegalArgumentError("Invalid new child!");
    }

    if (index < 0 || index >= this.args.length) {
      throw new IllegalArgumentError("Child index is not within range", {
        context: { index: index, range: `0 >= index < ${this.args.length}` },
      });
    }

    this.args[index] = newChild;
  }

  hasChildren(): boolean {
    return this._args.length > 0;
  }

  getChildren(): Statement[] {
    return [...this._args];
  }

  protected get args(): Statement[] {
    return this._args;
  }

  get export() {
    return this._export;
  }
}
