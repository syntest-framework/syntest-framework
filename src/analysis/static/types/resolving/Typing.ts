import { ElementType } from "../discovery/Element";

export interface Typing {
  type: TypingType
  name?: string
  import?: string
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
