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

import { ActionStatement } from "../action/ActionStatement";
import { Statement } from "../Statement";
import { Encoding, EncodingSampler } from "@syntest/framework";
import { IdentifierDescription } from "../../../analysis/static/parsing/IdentifierDescription";

/**
 * @author Dimitri Stallenberg
 */
export abstract class RootStatement extends ActionStatement {
  private _children: Statement[];

  protected constructor(
    identifierDescription: IdentifierDescription,
    type: string,
    uniqueId: string,
    args: Statement[],
    children: Statement[]
  ) {
    super(identifierDescription, type, uniqueId, args);
    this._children = children;
  }

  abstract mutate(
    sampler: EncodingSampler<Encoding>,
    depth: number
  ): RootStatement;

  abstract copy(): RootStatement;

  hasChildren(): boolean {
    return !!this.args.length || !!this._children.length;
  }

  getChildren(): Statement[] {
    return [...this.args, ...this._children];
  }

  get children(): Statement[] {
    return this._children;
  }


  setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new Error("Invalid new child!")
    }

    if (index >= this.args.length + this.children.length) {
      throw new Error("Invalid child location!")
    }

    if (index < this.args.length) {
      this.args[index] = newChild
    } else {
      index -= this.args.length
      this.children[index] = newChild
    }
  }

  getFlatTypes(): string[] {
    return [
      ...this.args.flatMap((a) => a.getFlatTypes()),
      ...this.children.flatMap((a) => a.getFlatTypes())
    ]
  }
}
