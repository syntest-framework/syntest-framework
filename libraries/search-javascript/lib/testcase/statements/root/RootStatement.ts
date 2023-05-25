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

import { ActionStatement } from "../action/ActionStatement";
import { Statement } from "../Statement";

/**
 * @author Dimitri Stallenberg
 */
export abstract class RootStatement extends ActionStatement {
  private _children: Statement[];

  protected constructor(
    id: string,
    name: string,
    type: string,
    uniqueId: string,
    arguments_: Statement[],
    children: Statement[]
  ) {
    super(id, name, type, uniqueId, arguments_);
    this._children = children;
  }

  abstract override mutate(
    sampler: EncodingSampler<Encoding>,
    depth: number
  ): RootStatement;

  abstract override copy(): RootStatement;

  override hasChildren(): boolean {
    return this.args.length > 0 || this._children.length > 0;
  }

  override getChildren(): Statement[] {
    return [...this.args, ...this._children];
  }

  get children(): Statement[] {
    return this._children;
  }

  override setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new Error("Invalid new child!");
    }

    if (index >= this.args.length + this.children.length) {
      throw new Error("Invalid child location!");
    }

    if (index < this.args.length) {
      this.args[index] = newChild;
    } else {
      index -= this.args.length;
      this.children[index] = newChild;
    }
  }

  override getFlatTypes(): string[] {
    return [
      ...this.args.flatMap((a) => a.getFlatTypes()),
      ...this.children.flatMap((a) => a.getFlatTypes()),
    ];
  }
}
