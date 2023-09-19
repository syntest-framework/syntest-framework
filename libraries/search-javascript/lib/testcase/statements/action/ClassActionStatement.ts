/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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
import { TypeEnum } from "@syntest/analysis-javascript";
import { shouldNeverHappen } from "@syntest/search";

import { Statement } from "../Statement";

import { ActionStatement } from "./ActionStatement";
import { ConstructorCall } from "./ConstructorCall";

export abstract class ClassActionStatement extends ActionStatement {
  private _constructor: ConstructorCall;

  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param ownType the return type of the function
   * @param uniqueId id of the gene
   * @param methodName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    ownType: TypeEnum,
    uniqueId: string,
    arguments_: Statement[],
    constructor_: ConstructorCall
  ) {
    super(
      variableIdentifier,
      typeIdentifier,
      name,
      ownType,
      uniqueId,
      arguments_
    );
    this._constructor = constructor_;
  }

  override setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new Error("Invalid new child!");
    }

    if (index < 0 || index > this.args.length) {
      throw new Error(shouldNeverHappen(`Invalid index used index: ${index}`));
    }

    if (index === this.args.length) {
      if (!(newChild instanceof ConstructorCall)) {
        throw new TypeError(shouldNeverHappen("should be a constructor"));
      }
      this._constructor = newChild;
    } else {
      this.args[index] = newChild;
    }
  }

  override hasChildren(): boolean {
    return true;
  }

  override getChildren(): Statement[] {
    return [...this.args, this._constructor];
  }

  get constructor_() {
    return this._constructor;
  }
}
