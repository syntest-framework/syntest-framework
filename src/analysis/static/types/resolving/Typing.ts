import { ElementType } from "../discovery/Element";

export interface Typing {
  type: TypingType
}

export interface ComplexTyping extends Typing {
  type: TypingType.Object
  name: string
  import: string
}

export enum TypingType {
  Unknown='any',
  Numeric='numeric',
  String='string',
  Boolean='boolean',
  Null='null',
  Regex='regex',

  Array='array',
  Object='object',

  Function='function'
}

export function elementTypeToTypingType(elementType: ElementType): TypingType | void {
  switch (elementType) {
  case ElementType.BooleanConstant:
    return TypingType.Boolean
  case ElementType.StringConstant:
    return TypingType.String
  case ElementType.NumericalConstant:
    return TypingType.Numeric
  case ElementType.NullConstant:
    return TypingType.Null
  case ElementType.RegexConstant:
    return TypingType.Regex
  }
}
