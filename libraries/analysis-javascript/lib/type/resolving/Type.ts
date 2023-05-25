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

import { TypeEnum } from "./TypeEnum";

export type Type = PrimitiveType | FunctionType | ArrayType | ObjectType;

export interface PrimitiveType {
  type:
    | TypeEnum.NUMERIC
    | TypeEnum.STRING
    | TypeEnum.BOOLEAN
    | TypeEnum.NULL
    | TypeEnum.UNDEFINED
    | TypeEnum.REGEX;
}

export function isPrimitiveType(type: Type): type is PrimitiveType {
  return (
    type.type === TypeEnum.NUMERIC ||
    type.type === TypeEnum.STRING ||
    type.type === TypeEnum.BOOLEAN ||
    type.type === TypeEnum.NULL ||
    type.type === TypeEnum.UNDEFINED ||
    type.type === TypeEnum.REGEX
  );
}

export interface FunctionType {
  type: TypeEnum.FUNCTION;
  // index -> id
  parameters: Map<number, string>;
  // id
  return: Set<string>;
}

export interface ArrayType {
  type: TypeEnum.ARRAY;
  // index -> id
  elements: Map<number, string>;
}

export interface ObjectType {
  type: TypeEnum.OBJECT;
  // name -> id
  properties: Map<string, string>;
}
