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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators
// TODO add missing

export interface Relation {
  id: string;
  type: RelationType;
  involved: string[];
  computed?: boolean;
}

export function getRelationName(type: RelationType): string {
  return Object.entries(RelationType).find(([, value]) => value === type)[0];
}

export enum RelationType {
  // special
  Return = "L->R",
  Call = "L(R)",
  PrivateName = "#L",
  ObjectProperty = "{L:R}",
  ObjectMethod = "{L(R)}",

  ClassProperty = "L{K:V}",
  StaticClassProperty = "L{static K:V}",
  ClassMethod = "L{R()}",
  AsyncClassMethod = "L{async R()}",
  StaticClassMethod = "L{static R()}",
  StaticAsyncClassMethod = "L{static async R()}",
  ClassConstructor = "L{constructor(R)}",
  ClassGetter = "L{get R}",
  ClassSetter = "L{set R}",

  ArrayPattern = "[L]",
  ObjectPattern = "{L}",
  RestElement = "...R",

  While = "while(L)", // also do while
  If = "if(L)",
  For = "for(L)",
  ForIn = "for(L in R)",
  ForOf = "for(L of R)",
  Switch = "switch(L) case R", // L === R bassically

  // Primary Expressions
  This = "this",
  // literals are processed differently
  ArrayInitializer = "[L]",
  ObjectInitializer = "{L}",
  ClassDefinition = "class L",
  FunctionDefinition = "function L(R)",
  FunctionStarDefinition = "function* L(R)",
  AsyncFunctionDefinition = "async function L(R)",
  AsyncFunctionStarDefinition = "async function* L(R)",
  // RegularExpression = "/L/", this is a literal
  TemplateLiteral = "`L`",
  Sequence = "(L,R)",

  // Left-hand-side Expressions
  PropertyAccessor = "L.R",
  OptionalPropertyAccessor = "L?.R",
  New = "new L()",

  // TODO new.target
  // TODO import.meta
  // TODO super()
  // TODO import()

  // UNARY
  // Increment and Decrement
  PlusPlusPostFix = "L++",
  MinusMinusPostFix = "L--",
  PlusPlusPrefix = "++L",
  MinusMinusPrefix = "--L",

  // Unary
  Delete = "delete L",
  Void = "void L",
  TypeOf = "typeof L",
  PlusUnary = "+L",
  MinusUnary = "-L",
  BitwiseNotUnary = "~L",
  LogicalNotUnary = "!L",
  Await = "await L",

  // BINARY
  // Arithmetic
  Addition = "L+R",
  Subtraction = "L-R",
  Division = "L/R",
  Multiplication = "L*R",
  Remainder = "L%R",
  Exponentiation = "L**R",

  // Relation
  Less = "L<R",
  Greater = "L>R",
  LessOrEqual = "L<=R",
  GreaterOrEqual = "L>=R",
  InstanceOf = "L instanceof R",
  In = "L in R",

  // Equality
  Equality = "L==R",
  InEquality = "L!=R",
  StrictEquality = "L===R",
  StrictInequality = "L!==R",

  // Bitwise shift
  BitwiseLeftShift = "L<<R",
  BitwiseRightShift = "L>>R",
  BitwiseUnsignedRightShift = "L>>>R",

  // Binary bitwise
  BitwiseAnd = "L&R",
  BitwiseOr = "L|R",
  BitwiseXor = "L^R",

  // Binary logical
  LogicalAnd = "L&&R",
  LogicalOr = "L||R",
  NullishCoalescing = "L??R",

  // Ternary
  Conditional = "C?L:R",

  // Assignment
  Assignment = "L=R",
  MultiplicationAssignment = "L*=R",
  ExponentiationAssignment = "L**=R",
  DivisionAssignment = "L/=R",
  RemainderAssigment = "L%=R",
  AdditionAssignment = "L+=R",
  SubtractionAssignment = "L-=R",
  LeftShiftAssignment = "L<<=R",
  RightShiftAssignment = "L>>=R",
  UnSignedRightShiftAssignment = "L>>>=R",
  BitwiseAndAssignment = "L&=R",
  BitwiseXorAssignment = "L^=R",
  BitwiseOrAssignment = "L|=R",
  LogicalAndAssignment = "L&&=R",
  LogicalOrAssignment = "L||=R",
  LogicalNullishAssignment = "L??=R",
  // destructuring assignment is equal to assignment

  // yield
  Yield = "yield L",
  YieldStar = "yield* L",

  // spread
  Spread = "...L",

  // comma
  Comma = "L,R",
}

function getUnaryRelationType(operator: string, prefix: boolean) {
  switch (operator) {
    case "++": {
      return prefix
        ? RelationType.PlusPlusPrefix
        : RelationType.PlusPlusPostFix;
    }
    case "--": {
      return prefix
        ? RelationType.MinusMinusPrefix
        : RelationType.MinusMinusPostFix;
    }

    case "delete": {
      return RelationType.Delete;
    }
    case "void": {
      return RelationType.Void;
    }
    case "typeof": {
      return RelationType.TypeOf;
    }
    case "+": {
      return RelationType.PlusUnary;
    }
    case "-": {
      return RelationType.MinusUnary;
    }
    case "~": {
      return RelationType.BitwiseNotUnary;
    }
    case "!": {
      return RelationType.LogicalNotUnary;
    }
    case "await": {
      return RelationType.Await;
    }
  }

  throw new Error(`Unsupported relation type operator: unary -> ${operator}`);
}

function getBinaryRelationType(operator: string) {
  switch (operator) {
    case "+": {
      return RelationType.Addition;
    }
    case "-": {
      return RelationType.Subtraction;
    }
    case "/": {
      return RelationType.Division;
    }
    case "*": {
      return RelationType.Multiplication;
    }
    case "%": {
      return RelationType.Remainder;
    }
    case "**": {
      return RelationType.Exponentiation;
    }
    case "<": {
      return RelationType.Less;
    }
    case ">": {
      return RelationType.Greater;
    }
    case "<=": {
      return RelationType.LessOrEqual;
    }
    case ">=": {
      return RelationType.GreaterOrEqual;
    }
    case "instanceof": {
      return RelationType.InstanceOf;
    }
    case "in": {
      return RelationType.In;
    }

    case "==": {
      return RelationType.Equality;
    }
    case "!=": {
      return RelationType.InEquality;
    }
    case "===": {
      return RelationType.StrictEquality;
    }
    case "!==": {
      return RelationType.StrictInequality;
    }

    case "<<": {
      return RelationType.BitwiseLeftShift;
    }
    case ">>": {
      return RelationType.BitwiseRightShift;
    }
    case ">>>": {
      return RelationType.BitwiseUnsignedRightShift;
    }

    case "&": {
      return RelationType.BitwiseAnd;
    }
    case "|": {
      return RelationType.BitwiseOr;
    }
    case "^": {
      return RelationType.BitwiseXor;
    }

    case "&&": {
      return RelationType.LogicalAnd;
    }
    case "||": {
      return RelationType.LogicalAnd;
    }
    case "??": {
      return RelationType.NullishCoalescing;
    }
  }

  throw new Error(`Unsupported relation type operator: binary -> ${operator}`);
}

function getAssignmentRelationType(operator: string) {
  switch (operator) {
    case "=": {
      return RelationType.Assignment;
    }
    case "*=": {
      return RelationType.MultiplicationAssignment;
    }
    case "**=": {
      return RelationType.ExponentiationAssignment;
    }
    case "/=": {
      return RelationType.DivisionAssignment;
    }
    case "%=": {
      return RelationType.RemainderAssigment;
    }
    case "+=": {
      return RelationType.AdditionAssignment;
    }
    case "-=": {
      return RelationType.SubtractionAssignment;
    }
    case "<<=": {
      return RelationType.LeftShiftAssignment;
    }
    case ">>=": {
      return RelationType.RightShiftAssignment;
    }
    case ">>>=": {
      return RelationType.UnSignedRightShiftAssignment;
    }
    case "&=": {
      return RelationType.BitwiseAndAssignment;
    }
    case "^=": {
      return RelationType.BitwiseXorAssignment;
    }
    case "|=": {
      return RelationType.BitwiseOrAssignment;
    }
    case "&&=": {
      return RelationType.LogicalAndAssignment;
    }
    case "||=": {
      return RelationType.LogicalOrAssignment;
    }
    case "??=": {
      return RelationType.LogicalNullishAssignment;
    }
  }

  throw new Error(
    `Unsupported relation type operator: assignment -> ${operator}`
  );
}

export function getRelationType(
  type: string,
  operator: string,
  prefix = false
): RelationType {
  switch (type) {
    case "unary": {
      return getUnaryRelationType(operator, prefix);
    }
    case "binary": {
      return getBinaryRelationType(operator);
    }
    case "assignment": {
      return getAssignmentRelationType(operator);
    }
  }

  throw new Error(`Unsupported relation type operator: ${type} -> ${operator}`);
}
