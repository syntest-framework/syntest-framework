/*
 * Copyright 2020-2023
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
import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { AbstractSyntaxTreeVisitor } from "@syntest/ast-visitor-javascript";
import { ImplementationError } from "@syntest/diagnostics";

import { ConstantPool } from "./ConstantPool";

export class ConstantVisitor extends AbstractSyntaxTreeVisitor {
  protected _constantPool: ConstantPool;

  get constantPool() {
    return this._constantPool;
  }

  constructor(
    filePath: string,
    syntaxForgiving: boolean,
    constantPool: ConstantPool
  ) {
    super(filePath, syntaxForgiving);
    this._constantPool = constantPool;
  }

  public Literal: (path: NodePath<t.Literal>) => void = (
    path: NodePath<t.Literal>
  ) => {
    switch (path.node.type) {
      case "StringLiteral": {
        this._constantPool.addString(path.node.value);
        break;
      }
      case "NumericLiteral": {
        if (Number.isInteger(path.node.value)) {
          this._constantPool.addInteger(path.node.value);
        } else {
          this._constantPool.addNumeric(path.node.value);
        }
        break;
      }
      case "NullLiteral": {
        // Not useful for the constant pool
        break;
      }
      case "BooleanLiteral": {
        // Not useful for the constant pool
        break;
      }
      case "RegExpLiteral": {
        break;
      }
      case "TemplateLiteral": {
        break;
      }
      case "BigIntLiteral": {
        this._constantPool.addBigInt(BigInt(path.node.value));
        break;
      }
      case "DecimalLiteral": {
        this._constantPool.addNumeric(Number(path.node.value));
        break;
      }
      default: {
        // should never occur
        throw new ImplementationError("Unknown literal type");
      }
    }
  };
}
