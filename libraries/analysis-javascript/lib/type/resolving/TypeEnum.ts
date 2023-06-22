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

import { ElementType } from "../discovery/element/Element";

export enum TypeEnum {
  NUMERIC = "numeric",
  INTEGER = "integer", // decimal?

  STRING = "string",
  BOOLEAN = "boolean",
  NULL = "null",
  UNDEFINED = "undefined",
  REGEX = "regex",

  ARRAY = "array",
  OBJECT = "object",

  FUNCTION = "function",
}

export function elementTypeToTypingType(
  elementType: ElementType
):
  | TypeEnum.STRING
  | TypeEnum.NUMERIC
  | TypeEnum.BOOLEAN
  | TypeEnum.NULL
  | TypeEnum.UNDEFINED
  | TypeEnum.REGEX {
  switch (elementType) {
    case ElementType.StringLiteral: {
      return TypeEnum.STRING;
    }
    case ElementType.NumericalLiteral: {
      return TypeEnum.NUMERIC;
    }
    case ElementType.NullLiteral: {
      return TypeEnum.NULL;
    }
    case ElementType.BooleanLiteral: {
      return TypeEnum.BOOLEAN;
    }
    case ElementType.RegExpLiteral: {
      return TypeEnum.REGEX;
    }
    case ElementType.TemplateLiteral: {
      return TypeEnum.STRING;
    }
    case ElementType.BigIntLiteral: {
      return TypeEnum.NUMERIC;
    }

    case ElementType.Undefined: {
      return TypeEnum.UNDEFINED;
    }
  }

  throw new Error("Unknown element type");
}
