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
import { shouldNeverHappen } from "@syntest/search";

import { JavaScriptDecoder } from "../../../testbuilding/JavaScriptDecoder";
import { JavaScriptTestCaseSampler } from "../../sampling/JavaScriptTestCaseSampler";
import { Decoding, Statement } from "../Statement";

import { ActionStatement } from "./ActionStatement";
import { ConstantObject } from "./ConstantObject";

/**
 * @author Dimitri Stallenberg
 */
export class ObjectFunctionCall extends ActionStatement {
  private _object: ConstantObject;

  /**
   * Constructor
   * @param identifierDescription the return type options of the function
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param methodName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    variableIdentifier: string,
    typeIdentifier: string,
    name: string,
    type: string,
    uniqueId: string,
    arguments_: Statement[],
    object_: ConstantObject
  ) {
    super(variableIdentifier, typeIdentifier, name, type, uniqueId, arguments_);
    this._classType = "ObjectFunctionCall";
    this._object = object_;
  }

  mutate(
    sampler: JavaScriptTestCaseSampler,
    depth: number
  ): ObjectFunctionCall {
    const arguments_ = this.args.map((a: Statement) => a.copy());
    let object_ = this._object.copy();
    const index = prng.nextInt(0, arguments_.length);

    if (index < arguments_.length) {
      // go over each arg
      arguments_[index] = arguments_[index].mutate(sampler, depth + 1);
    } else {
      object_ = object_.mutate(sampler, depth + 1);
    }

    return new ObjectFunctionCall(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      prng.uniqueId(),
      arguments_,
      object_
    );
  }

  override setChild(index: number, newChild: Statement) {
    if (!newChild) {
      throw new Error("Invalid new child!");
    }

    if (index < 0 || index > this.args.length) {
      throw new Error(shouldNeverHappen(`Invalid index used index: ${index}`));
    }

    if (index === this.args.length) {
      if (!(newChild instanceof ConstantObject)) {
        throw new TypeError(shouldNeverHappen("should be a constant object"));
      }
      this._object = newChild;
    } else {
      this.args[index] = newChild;
    }
  }

  override hasChildren(): boolean {
    return true;
  }

  override getChildren(): Statement[] {
    return [...this.args, this._object];
  }

  copy(): ObjectFunctionCall {
    const deepCopyArguments = this.args.map((a: Statement) => a.copy());

    return new ObjectFunctionCall(
      this.variableIdentifier,
      this.typeIdentifier,
      this.name,
      this.type,
      this.uniqueId,
      deepCopyArguments,
      this._object.copy()
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

    let decoded = `const ${this.varName} = await ${this._object.varName}.${this.name}(${arguments_})`;

    if (options.addLogs) {
      const logDirectory = decoder.getLogDirectory(id, this.varName);
      decoded += `\nawait fs.writeFileSync('${logDirectory}', '' + ${this.varName} + ';sep;' + JSON.stringify(${this.varName}))`;
    }

    return [
      ...this._object.decode(decoder, id, options),
      ...argumentStatements,
      {
        decoded: decoded,
        reference: this,
      },
    ];
  }

  // TODO
  decodeErroring(): string {
    const arguments_ = this.args.map((a) => a.varName).join(", ");
    return `await expect(${this._object.varName}.${this.name}(${arguments_})).to.be.rejectedWith(Error);`;
  }
}
