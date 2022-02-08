import { Element } from "./Element";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators
// TODO add missing

export interface Relation {
  relation: RelationType
  involved: Element[]
}

export enum RelationType {
  // UNARY
  //
  NotUnary="!L",
  PlusUnary="+L",
  MinusUnary="-L",
  TypeOf="typeof L",
  Delete="delete L",

  //
  PlusPlus="L++",
  MinusMinus="L--",
  // spread
  Spread="...",

  // BINARY
  //
  PlusBinary="L+R",
  MinusBinary="L-R",
  Divide="L/R",
  Multiply="L*R",
  Mod="L%R",

  // comparison
  Equal="L===R",
  NotEqual="L!==R",
  typeCoercionEqual="L==R",
  typeCoercionNotEqual="L!=R",
  StrictSmaller="L<R",
  StrictGreater="L>R",
  Smaller="L<=R",
  Greater="L>=R",

  // shift
  LeftShift="L<<R",
  RightShift="L>>R",
  UnsignedRightShift="L>>>R",

  // logical
  LazyOr="L||R",
  LazyAnd="L&&R",
  Or="L|R",
  And="L&R",
  // function
  Return="L->R",
  // member
  Member="L.R",

  // assignments
  Assignment="L=R",
  MultiplicationAssignment="L*=R",
  ExponentiationAssignment="L**=R",
  DivisionAssignment="L/=R",
  RemainderAssigment="L%=R",
  AdditionAssignment="L+=R",
  SubtractionAssignment="L-=R",
  LeftShiftAssignment="L<<=R",
  RightShiftAssignment="L>>=R",
  UnSignedRightShiftAssignment="L>>>=R",

  // TERNARY
  Ternary="Q?L:R",

  // MULTI
  // function
  Parameters="L_R",
  Call="L(R)",
  // object
  Object="{L:R}", // TODO not correct L doesnt matter
  // array
  Array="[L]",

}


export function getRelationType(type: string, operator: string): RelationType {
  if (type === "unary") {
    switch (operator) {
      case "!":
        return RelationType.NotUnary
      case "-":
        return RelationType.MinusUnary
      case "+":
        return RelationType.PlusUnary
      case "typeof":
        return RelationType.TypeOf
      case "delete":
        return RelationType.Delete
      case "++":
        return RelationType.PlusPlus
      case "--":
        return RelationType.MinusMinus
    }
  } else if (type === "binary") {
    switch (operator) {
      case "+":
        return RelationType.PlusBinary
      case "-":
        return RelationType.MinusBinary
      case "/":
        return RelationType.Divide
      case "*":
        return RelationType.Multiply
      case "%":
        return RelationType.Mod

      case "===":
        return RelationType.Equal
      case "!==":
        return RelationType.NotEqual
      case "==":
        return RelationType.typeCoercionEqual
      case "!=":
        return RelationType.typeCoercionNotEqual

      case "<":
        return RelationType.StrictSmaller
      case ">":
        return RelationType.StrictGreater
      case "<=":
        return RelationType.Smaller
      case ">=":
        return RelationType.Greater

      // bitwise shifts
      case "<<":
        return RelationType.LeftShift
      case ">>":
        return RelationType.RightShift
      case ">>>":
        return RelationType.UnsignedRightShift


      case "||":
        return RelationType.LazyOr
      case "|":
        return RelationType.LazyAnd
      case "&&":
        return RelationType.Or
      case "&":
        return RelationType.And
    }
  }

  throw new Error(`Unsupported relation type operator: ${type} -> ${operator}`)
}
