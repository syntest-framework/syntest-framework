import { ElementType } from "../variable/Element";

export interface Typing {
  type: TypingType
  import?: string,

  params?: Typing[]
}

export enum TypingType {
  Numeric,
  String,
  Boolean,
  Null,
  Regex,

  Array,
  Object,

  Function
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
