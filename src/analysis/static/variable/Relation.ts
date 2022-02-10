import { Element } from "./Element";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators
// TODO add missing

export interface Relation {
  relation: RelationType
  involved: Element[]
}

export enum RelationType {
  // Left-hand-side expressions
  PropertyAccessor="L.R",
  New="new L()",
  // TODO new.target
  // TODO import.meta
  // TODO super
  Spread="...L",

  // UNARY
  // Increment and Decrement
  PlusPlusPostFix="L++",
  MinusMinusPostFix="L--",
  PlusPlusPrefix="++L",
  MinusMinusPrefix="--L",

  // Unary
  Delete="delete L",
  Void="void L",
  TypeOf="typeof L",
  PlusUnary="+L",
  MinusUnary="-L",
  BitwiseNotUnary="~L",
  LogicalNotUnary="!L",

  // BINARY
  // Arithmetic
  Addition="L+R",
  Subtraction="L-R",
  Division="L/R",
  Multiplication="L*R",
  Remainder="L%R",
  Exponentiation="L**R",

  // Relation
  In="L in R",
  InstanceOf="L instanceof R",
  Less="L<R",
  Greater="L>R",
  LessOrEqual="L<=R",
  GreaterOrEqual="L>=R",

  // Equality
  Equality="L==R",
  InEquality="L!=R",
  StrictEquality="L===R",
  StrictInequality="L!==R",

  // Bitwise shift
  BitwiseLeftShift="L<<R",
  BitwiseRightShift="L>>R",
  BitwiseUnsignedRightShift="L>>>R",

  // Binary bitwise
  BitwiseAnd="L&R",
  BitwiseOr="L|R",
  BitwiseXOr="L^R",

  // Binary logical
  LogicalAnd="L&&R",
  LogicalOr="L||R",
  NullishCoalescing="L??R",

  // Ternary
  Conditional="C?L:R",

  // Optional chaining
  // TODO

  // Assignment
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
  BitwiseAndAssignment="L&=R",
  BitwiseXorAssignment="L^=R",
  BitwiseOrAssignment="L|=R",
  LogicalAndAssignment="L&&=R",
  LogicalOrAssignment="L||=R",
  LogicalNullishAssignment="L??=R",
  // TODO destructuring assignment



  // function
  Return="L->R",

  // MULTI
  // function
  Parameters="L_R",
  Call="L(R)",
  // object
  Object="{L:R}", // TODO not correct L doesnt matter
  // array
  Array="[L]",

}


export function getRelationType(type: string, operator: string, prefix=false): RelationType {
  if (type === "unary") {
    switch (operator) {
      case "++":
        return prefix ? RelationType.PlusPlusPrefix : RelationType.PlusPlusPostFix
      case "--":
        return prefix ? RelationType.MinusMinusPrefix : RelationType.MinusMinusPostFix

      case "delete":
        return RelationType.Delete
      case "void":
        return RelationType.Void
      case "typeof":
        return RelationType.TypeOf
      case "+":
        return RelationType.PlusUnary
      case "-":
        return RelationType.MinusUnary
      case "~":
        return RelationType.BitwiseNotUnary
      case "!":
        return RelationType.LogicalNotUnary
    }
  } else if (type === "binary") {
    switch (operator) {
      case "+":
        return RelationType.Addition
      case "-":
        return RelationType.Subtraction
      case "/":
        return RelationType.Division
      case "*":
        return RelationType.Multiplication
      case "%":
        return RelationType.Remainder
      case "**":
        return RelationType.Exponentiation

      case "in":
        return RelationType.In
      case "instanceof":
        return RelationType.InstanceOf
      case "<":
        return RelationType.Less
      case ">":
        return RelationType.Greater
      case "<=":
        return RelationType.LessOrEqual
      case ">=":
        return RelationType.GreaterOrEqual

      case "==":
        return RelationType.Equality
      case "!=":
        return RelationType.InEquality
      case "===":
        return RelationType.StrictEquality
      case "!==":
        return RelationType.StrictInequality

      case "<<":
        return RelationType.BitwiseLeftShift
      case ">>":
        return RelationType.BitwiseRightShift
      case ">>>":
        return RelationType.BitwiseUnsignedRightShift

      case "&":
        return RelationType.BitwiseAnd
      case "|":
        return RelationType.BitwiseOr
      case "^":
        return RelationType.BitwiseXOr

      case "&&":
        return RelationType.LogicalAnd
      case "||":
        return RelationType.LogicalAnd
      case "??":
        return RelationType.NullishCoalescing
    }
  } else if (type === "assignment") {
    switch (operator) {
      case "=":
        return RelationType.Assignment
      case "*=":
        return RelationType.MultiplicationAssignment
      case "**=":
        return RelationType.ExponentiationAssignment
      case "/=":
        return RelationType.DivisionAssignment
      case "%=":
        return RelationType.RemainderAssigment
      case "+=":
        return RelationType.AdditionAssignment
      case "-=":
        return RelationType.SubtractionAssignment
      case "<<=":
        return RelationType.LeftShiftAssignment
      case ">>=":
        return RelationType.RightShiftAssignment
      case ">>>=":
        return RelationType.UnSignedRightShiftAssignment
      case "&=":
        return RelationType.BitwiseAndAssignment
      case "^=":
        return RelationType.BitwiseXorAssignment
      case "|=":
        return RelationType.BitwiseOrAssignment
      case "&&=":
        return RelationType.LogicalAndAssignment
      case "||=":
        return RelationType.LogicalOrAssignment
      case "??=":
        return RelationType.LogicalNullishAssignment
    }
  }

  throw new Error(`Unsupported relation type operator: ${type} -> ${operator}`)
}
