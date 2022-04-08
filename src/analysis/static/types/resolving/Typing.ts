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
import { ElementType } from "../discovery/Element";
import { ComplexObject } from "../discovery/object/ComplexObject";
import { TypeProbabilityMap } from "./TypeProbabilityMap";

export interface Typing {
  type: TypingType
  object?: ComplexObject
  propertyTypings?: Map<string, TypeProbabilityMap>
}

export enum TypingType {
  ANY='any',
  NUMERIC='numeric',
  STRING='string',
  BOOLEAN='boolean',
  NULL='null',
  REGEX='regex',

  ARRAY='array',
  OBJECT='object',

  FUNCTION='function'
}

export function elementTypeToTypingType(elementType: ElementType): TypingType | void {
  switch (elementType) {
  case ElementType.BooleanConstant:
    return TypingType.BOOLEAN
  case ElementType.StringConstant:
    return TypingType.STRING
  case ElementType.NumericalConstant:
    return TypingType.NUMERIC
  case ElementType.NullConstant:
    return TypingType.NULL
  case ElementType.RegexConstant:
    return TypingType.REGEX
  }
}
