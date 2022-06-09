/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

export class BranchDistance {
  private K = 1 // punishment factor

  public static branchDistance(
    condition: string,
    condition_ast: string,
    variables: any,
    target: boolean
  ): number {
    if (condition === undefined || condition_ast === undefined || variables === undefined) {
      return 1
    }

    const ast = JSON.parse(condition_ast)

    const branchDistance = new BranchDistance();

    let [distance, direct] = branchDistance.resolve(ast, variables)

    if (direct) {
      distance = distance ? 0 : 1
    }

    if (!target) {
      distance = 1 - distance
    }

    if (distance > 1 || distance < 0) {
      throw new Error("Invalid distance!")
    }

    return distance
  }

  evaluate(ast: any, variables: any): [any, boolean] {
    if (!this[ast.type]) {
      throw new Error(`Unimplemented ast type ${ast.type}`)
    }

    return this[ast.type](ast, variables)
  }

  resolve(ast, variables: any): [any, boolean] {
    switch (ast.type) {
      case "StringLiteral":
      case "NumericLiteral":
      case "BooleanLiteral":
      case "TemplateLiteral":
      case "RegExpLiteral":
        return [ast.value, true]
      case "NullLiteral":
        return [null, true]

      case "Identifier":
        const value = variables[ast.name]
        // TODO check if this is actually primitive?
        return [value, true]
      case "UpdateExpression":
        return this.resolve(ast.argument, variables)

      case "MemberExpression":
        if (ast.object.type === 'Identifier' && ast.property.type === 'Identifier') {
          const value = variables[`${ast.object.name}.${ast.property.name}`]
          return [value, true]
        }

      case "ThisExpression":
      // TODO not sure how to handle this
      // TODO the result would be cool but functions that alter state (side-effects) ruin the idea
      case "AssignmentExpression":
      case "CallExpression":
        return [undefined, true]
    }

    return this.evaluate(ast, variables)
  }

  UnaryExpression(ast: any, variables: any): [any, boolean] {
    let [arg, direct] = this.resolve(ast.argument, variables)

    if (direct) {
      switch (ast.operator) {
        case "!":
          if (typeof arg === 'number') {
            return [BranchDistance.normalize(Math.abs(0 - arg)), false]
          } else {
            return [arg ? 1 : 0, false]
          }
        case "typeof":
          return [typeof arg, true]
        case "-":
          return [-arg, true]
        case "+":
          return [+arg, true]

        // TODO postfix/prefix
        case "++":
          return [++arg, true]
        case "--":
          return [--arg, true]

        case "~":
          return [~arg, true]
      }
    } else {
      switch (ast.operator) {
        case "!":
          return [1 - arg, false]

      }
    }

    throw new Error(`Unknown unary operator: "${ast.operator}" for direct=${direct}`)
  }

  BinaryExpression(ast: any, variables: any): [any, boolean] {
    const [left, lDirect] = this.resolve(ast.left, variables)
    const [right, rDirect] = this.resolve(ast.right, variables)

    if (!lDirect) {
      throw new Error("left should be direct")
    }
    if (!rDirect) {
      throw new Error("right not be direct")
    }

    switch (ast.operator) {
      // should both be direct : returns direct
      case "+":
        return [left + right, true]
      case "-":
        return [left - right, true]
      case "*":
        return [left * right, true]
      case "/":
        return [left / right, true]
      case "%":
        return [left % right, true]
      case "**":
        return [left ** right, true]

      case "&":
        return [left & right, true]
      case "|":
        return [left | right, true]
      case "^":
        return [left ^ right, true]
    }

    switch (ast.operator) {
      // should both be direct : returns not direct

      case "==":
        // TODO
      case "===":
        if (typeof left === 'number' && typeof right === 'number') {
          return [BranchDistance.normalize(Math.abs(left - right)), false]
        } else if (typeof left === 'string' && typeof right === 'string') {
          return [BranchDistance.normalize(this.editDistDP(left, right)), false]
        } else if (typeof left === 'boolean' && typeof right === 'boolean') {
          return [left === right ? 0 : 1, false]
        } else {
          // TODO type difference?!
        }
        return [left === right ? 0 : 1, false]

      case "!=":
        // TODO
      case "!==":
        return [left !== right ? 0 : 1, false]
      case "<":
        return [left < right ? 0 : BranchDistance.normalize(left - right + this.K), false]
      case "<=":
        return [left <= right ? 0 : BranchDistance.normalize(left - right), false]
      case ">":
        return [left > right ? 0 : BranchDistance.normalize(right - left + this.K), false]
      case ">=":
        return [left >= right ? 0 : BranchDistance.normalize(right - left), false]

      case "instanceof":
        return [left instanceof right ? 0 : 1, false]
      case "in":
        return [left in right ? 0 : 1, false]
    }

    throw new Error(`Unknown binary operator: ${ast.operator}`)
  }

  LogicalExpression(ast: any, variables: any): [number, boolean] {
    let [left, lDirect] = this.resolve(ast.left, variables)
    let [right, rDirect] = this.resolve(ast.right, variables)

    const operator = ast.operator

    if (lDirect) {
      left = left ? 0 : 1
    }

    if (rDirect) {
      right = right ? 0 : 1
    }

    switch (operator) {
      // should both NOT be direct : returns not direct
      case "&&":
        return [BranchDistance.normalize(left + right), false]
      case "||":
        return [BranchDistance.normalize(Math.min(left, right)), false]
      // case ""
    }

    throw new Error(`Unknown logical operator: ${ast.operator}`)
  }

  private editDistDP(str1: string, str2: string) {
    const m = str1.length
    const n = str2.length
    const table = []

    for (let i = 0; i <= m; i++) {
      table.push([])
      for (let j = 0; j <= n; j++) {
        table[i].push(0)
      }
    }

    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= n; j++) {
        if (i == 0) {
          table[i][j] = j
        } else if (j == 0) {
          table[i][j] = i
        } else if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          table[i][j] = table[i - 1][j - 1]
        } else {
          table[i][j] = 1 + Math.min(table[i][j - 1], Math.min(table[i - 1][j], table[i - 1][j - 1]))
        }
      }
    }

    return table[m][n]
  }

  /**
   * Calculate the branch distance
   *
   * @param opcode the opcode (the comparison operator)
   * @param left the left values of the comparison (multiple execution traces)
   * @param right the right values of the comparison (multiple execution traces)
   * @param target the side of the branch you want to cover
   */
  public static branchDistanceNumeric(
    opcode: string,
    left: number[],
    right: number[],
    target: boolean
  ) {
    let branchDistance: number;

    // TODO the SGT and SLT opcodes are for signed numbers
    // look here: https://docs.soliditylang.org/en/v0.5.5/assembly.html

    // TODO other opcodes

    // TODO move this to the solidity project and make an abstraction of this class

    switch (opcode) {
      case "EQ":
        if (target) {
          branchDistance = this.equalNumeric(left, right);
        } else {
          branchDistance = this.notEqualNumeric(left, right);
        }
        break;
      case "NEQ":
        if (target) {
          branchDistance = this.notEqualNumeric(left, right);
        } else {
          branchDistance = this.equalNumeric(left, right);
        }
        break;
      case "GT":
        if (target) {
          branchDistance = this.greater(left, right);
        } else {
          branchDistance = this.smallerEqual(left, right);
        }
        break;
      case "LT":
        if (target) {
          branchDistance = this.smaller(left, right);
        } else {
          branchDistance = this.greaterEqual(left, right);
        }
        break;
      case "SGT":
        if (target) {
          branchDistance = this.greater(left, right);
        } else {
          branchDistance = this.smallerEqual(left, right);
        }
        break;
      case "SLT":
        if (target) {
          branchDistance = this.smaller(left, right);
        } else {
          branchDistance = this.greaterEqual(left, right);
        }
        break;
    }

    return this.normalize(branchDistance);
  }

  private static normalize(x: number): number {
    // return 1 - Math.pow(1.001, -x)
    return x / (x + 1);
  }

  private static equalNumeric(left: number[], right: number[]): number {
    let minimum = Number.MAX_VALUE;
    for (let index = 0; index < left.length; index++) {
      minimum = Math.min(minimum, Math.abs(left[index] - right[index]));
    }
    return minimum;
  }

  private static notEqualNumeric(left: number[], right: number[]): number {
    let minimum = Number.MAX_VALUE;

    for (let index = 0; index < left.length; index++) {
      if (left[index] != right[index]) {
        minimum = 0.0;
      } else {
        minimum = Math.min(minimum, 1.0);
      }
    }
    return minimum;
  }

  private static greater(left: number[], right: number[]): number {
    let minimum = Number.MAX_VALUE;

    for (let index = 0; index < left.length; index++) {
      if (left[index] > right[index]) {
        minimum = 0.0;
      } else {
        minimum = Math.min(minimum, right[index] - left[index] + 1);
      }
    }
    return minimum;
  }

  private static smallerEqual(left: number[], right: number[]): number {
    let minimum = Number.MAX_VALUE;

    for (let index = 0; index < left.length; index++) {
      if (left[index] <= right[index]) {
        minimum = 0.0;
      } else {
        minimum = Math.min(minimum, left[index] - right[index]);
      }
    }
    return minimum;
  }

  private static greaterEqual(left: number[], right: number[]): number {
    let minimum = Number.MAX_VALUE;

    for (let index = 0; index < left.length; index++) {
      if (left[index] >= right[index]) {
        minimum = 0.0;
      } else {
        minimum = Math.min(minimum, right[index] - left[index]);
      }
    }
    return minimum;
  }

  private static smaller(left: number[], right: number[]): number {
    let minimum = Number.MAX_VALUE;

    for (let index = 0; index < left.length; index++) {
      if (left[index] < right[index]) {
        minimum = 0.0;
      } else {
        minimum = Math.min(minimum, left[index] - right[index] + 1);
      }
    }
    return minimum;
  }
}
