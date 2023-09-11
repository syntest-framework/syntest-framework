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

export type Element = Identifier | Literal;

export interface Identifier {
  id: string;
  bindingId: string;
  filePath: string;
  location: {
    startIndex: number;
    endIndex: number;
  };
  type: ElementType.Identifier;
  name: string;
}

export interface Literal {
  id: string;
  bindingId: string;
  filePath: string;
  location: {
    startIndex: number;
    endIndex: number;
  };
  type:
    | ElementType.StringLiteral
    | ElementType.NumericalLiteral
    | ElementType.NullLiteral
    | ElementType.BooleanLiteral
    | ElementType.RegExpLiteral
    | ElementType.TemplateLiteral
    | ElementType.BigIntLiteral
    | ElementType.DecimalLiteral
    | ElementType.Undefined;
  value: string;
}

export enum ElementType {
  StringLiteral = "stringLiteral",
  NumericalLiteral = "numericalLiteral",
  NullLiteral = "nullLiteral",
  BooleanLiteral = "booleanLiteral",
  RegExpLiteral = "regExpLiteral",
  TemplateLiteral = "templateLiteral",
  BigIntLiteral = "bigIntLiteral",
  DecimalLiteral = "decimalLiteral",

  Undefined = "undefined",

  Identifier = "identifier",
}
