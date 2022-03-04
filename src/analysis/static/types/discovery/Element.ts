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
import { Scope } from "./Scope";

export interface Element {
  scope: Scope
  type: ElementType
  value: string
}

export function isInstanceOfElement(object: any): object is Element {
  return 'scope' in object && 'type' in object && 'value' in object
}

export enum ElementType {
  StringConstant='stringConstant',
  NumericalConstant='numericalConstant',
  BooleanConstant='booleanConstant',
  NullConstant='nullConstant',
  RegexConstant='regexConstant',
  Identifier='identifier',
  Relation='relation'
}

export function getElement(scope: Scope, node): Element {
  if (node.type === "StringLiteral"
  || node.type === "TemplateLiteral") {
    return {
      scope: scope,
      type: ElementType.StringConstant,
      value: node.value
    }
  } else if (node.type === "NumericLiteral") {
    return {
      scope: scope,
      type: ElementType.NumericalConstant,
      value: node.value
    }
  } else if (node.type === "BooleanLiteral") {
    return {
      scope: scope,
      type: ElementType.BooleanConstant,
      value: node.value
    }
  } else if (node.type === "RegExpLiteral") {
    return {
      scope: scope,
      type: ElementType.RegexConstant,
      value: node.pattern
    }
  } else if (node.type === "NullLiteral") {
    return {
      scope: scope,
      type: ElementType.NullConstant,
      value: node.value
    }
  } else if (node.type === "Identifier") {
    return {
      scope: scope,
      type: ElementType.Identifier,
      value: node.name
    }
  } else if (node.type === "ThisExpression") {
    // TODO should be done differently maybe
    return {
      scope: scope,
      type: ElementType.Identifier,
      value: 'this'
    }
  } else if (node.type === "Super") {
    // TODO should be done differently maybe
    return {
      scope: scope,
      type: ElementType.Identifier,
      value: 'super'
    }
  } else if (node.type === 'UnaryExpression'
    || node.type === 'UpdateExpression'
    || node.type === 'CallExpression'

    || node.type === 'BinaryExpression'
    || node.type === 'LogicalExpression'

    || node.type === 'ConditionalExpression'

    || node.type === 'MemberExpression'

    || node.type === 'ArrowFunctionExpression'

    // TODO

    || node.type === 'SpreadElement'
    || node.type === 'NewExpression'
    || node.type === 'SequenceExpression'

    || node.type === 'ArrayExpression'
    || node.type === 'ObjectExpression'

    || node.type === 'ObjectProperty' // TODO not sure about this one

    || node.type === 'AssignmentExpression') {
    return {
      scope: scope,
      type: ElementType.Relation,
      value: `%${node.start}-${node.end}`
    }
  }
  throw new Error(`Cannot get element: "${scope.name}" -> ${node.type}`)
}

export function getElementId(element: Element): string {
  return `scope=(name=${element.scope.name},filePath=${element.scope.filePath},type=${element.scope.type}),type=${element.type},value=${element.value}`
}
