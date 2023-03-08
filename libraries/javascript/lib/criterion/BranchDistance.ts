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

import * as t from "@babel/types";

export class BranchDistance {
  private K = 1; // punishment factor

  public static branchDistance(
    condition: string,
    condition_ast: string,
    variables: Record<string, unknown>,
    target: boolean
  ): number {
    if (
      condition === undefined ||
      condition_ast === undefined ||
      variables === undefined
    ) {
      return 1;
    }

    const ast = JSON.parse(condition_ast);

    const branchDistance = new BranchDistance();

    const { value, direct } = branchDistance.resolve(ast, variables);
    let distance = value;

    if (direct) {
      distance = distance ? 0 : 1;
    }

    if (!target) {
      distance = 1 - distance;
    }

    if (distance > 1 || distance < 0) {
      throw new Error("Invalid distance!");
    }

    return distance;
  }

  evaluate(
    ast: t.Node,
    variables: Record<string, unknown>
    // eslint-disable-next-line
  ): { value: any; direct: boolean } {
    if (!this[ast.type]) {
      throw new Error(`Unimplemented ast type ${ast.type}`);
    }

    return this[ast.type](ast, variables);
  }

  resolve(
    ast: t.Node,
    variables: Record<string, unknown>
    // eslint-disable-next-line
  ): { value: any; direct: boolean } {
    switch (ast.type) {
      case "StringLiteral":
      case "NumericLiteral":
      case "BooleanLiteral":
        return { value: ast.value, direct: true };
      case "RegExpLiteral":
        return { value: ast.pattern, direct: true };
      case "NullLiteral":
        return { value: null, direct: true };

      case "Identifier":
        // TODO check if this is actually primitive?
        return { value: variables[ast.name], direct: true };

      case "MemberExpression":
        if (
          ast.object.type === "Identifier" &&
          ast.property.type === "Identifier"
        ) {
          const value = variables[`${ast.object.name}.${ast.property.name}`];
          return { value: value, direct: true };
        }

      case "ThisExpression":
      // TODO not sure how to handle this
      // TODO the result would be cool but functions that alter state (side-effects) ruin the idea
      case "AssignmentExpression":
      case "CallExpression":
        return { value: undefined, direct: true };
    }

    return this.evaluate(ast, variables);
  }

  // eslint-disable-next-line
  UpdateExpression(
    ast: t.UpdateExpression,
    variables: Record<string, unknown>
  ): { value: number; direct: boolean } {
    const { value, direct } = this.resolve(ast.argument, variables);
    if (direct) {
      switch (ast.operator) {
        // TODO postfix/prefix
        case "++":
          return { value: value + 1, direct: true };
        case "--":
          return { value: value - 1, direct: true };
      }
    }

    throw new Error(
      `Unknown update operator: "${ast.operator}" for direct=${direct}`
    );
  }

  UnaryExpression(
    ast: t.UnaryExpression,
    variables: Record<string, unknown>
    // eslint-disable-next-line
  ): { value: any; direct: boolean } {
    const { value, direct } = this.resolve(ast.argument, variables);

    if (direct) {
      switch (ast.operator) {
        case "!":
          if (typeof value === "number") {
            return {
              value: BranchDistance.normalize(Math.abs(0 - value)),
              direct: false,
            };
          } else {
            return { value: value ? 1 : 0, direct: false };
          }
        case "typeof":
          return { value: typeof value, direct: true };
        case "-":
          return { value: -value, direct: true };
        case "+":
          return { value: +value, direct: true };
        case "~":
          return { value: ~value, direct: true };
      }
    } else {
      switch (ast.operator) {
        case "!":
          return { value: 1 - value, direct: false };
      }
    }

    throw new Error(
      `Unknown unary operator: "${ast.operator}" for direct=${direct}`
    );
  }

  BinaryExpression(
    ast: t.BinaryExpression,
    variables: Record<string, unknown>
    // eslint-disable-next-line
  ): { value: any; direct: boolean } {
    // eslint-disable-next-line
    const { value: left, direct: lDirect } = this.resolve(ast.left, variables);
    // eslint-disable-next-line
    const { value: right, direct: rDirect } = this.resolve(
      ast.right,
      variables
    );

    if (!lDirect) {
      throw new Error("left should be direct");
    }
    if (!rDirect) {
      throw new Error("right not be direct");
    }

    switch (ast.operator) {
      // should both be direct : returns direct
      case "+":
        return { value: left + right, direct: true };
      case "-":
        return { value: left - right, direct: true };
      case "*":
        return { value: left * right, direct: true };
      case "/":
        return { value: left / right, direct: true };
      case "%":
        return { value: left % right, direct: true };
      case "**":
        return { value: left ** right, direct: true };

      case "&":
        return { value: left & right, direct: true };
      case "|":
        return { value: left | right, direct: true };
      case "^":
        return { value: left ^ right, direct: true };
    }

    switch (ast.operator) {
      // should both be direct : returns not direct

      case "==":
      // TODO
      case "===":
        if (typeof left === "number" && typeof right === "number") {
          return {
            value: BranchDistance.normalize(Math.abs(left - right)),
            direct: false,
          };
        } else if (typeof left === "string" && typeof right === "string") {
          return {
            value: BranchDistance.normalize(this.editDistDP(left, right)),
            direct: false,
          };
        } else if (typeof left === "boolean" && typeof right === "boolean") {
          return { value: left === right ? 0 : 1, direct: false };
        } else {
          // TODO type difference?!
        }
        return { value: left === right ? 0 : 1, direct: false };

      case "!=":
      // TODO
      case "!==":
        return { value: left !== right ? 0 : 1, direct: false };
      case "<":
        return {
          value:
            left < right ? 0 : BranchDistance.normalize(left - right + this.K),
          direct: false,
        };
      case "<=":
        return {
          value: left <= right ? 0 : BranchDistance.normalize(left - right),
          direct: false,
        };
      case ">":
        return {
          value:
            left > right ? 0 : BranchDistance.normalize(right - left + this.K),
          direct: false,
        };
      case ">=":
        return {
          value: left >= right ? 0 : BranchDistance.normalize(right - left),
          direct: false,
        };

      case "instanceof":
        return { value: left instanceof right ? 0 : 1, direct: false };
      case "in":
        return { value: left in right ? 0 : 1, direct: false };
    }

    throw new Error(`Unknown binary operator: ${ast.operator}`);
  }

  LogicalExpression(
    ast: t.LogicalExpression,
    variables: Record<string, unknown>
    // eslint-disable-next-line
  ): { value: any; direct: boolean } {
    // eslint-disable-next-line
    let { value: left, direct: lDirect } = this.resolve(ast.left, variables);
    // eslint-disable-next-line
    let { value: right, direct: rDirect } = this.resolve(ast.right, variables);

    const operator = ast.operator;

    if (lDirect) {
      left = left ? 0 : 1;
    }

    if (rDirect) {
      right = right ? 0 : 1;
    }

    switch (operator) {
      // should both NOT be direct : returns not direct
      case "&&":
        return { value: BranchDistance.normalize(left + right), direct: false };
      case "||":
        return {
          value: BranchDistance.normalize(Math.min(left, right)),
          direct: false,
        };
      // case ""
    }

    throw new Error(`Unknown logical operator: ${ast.operator}`);
  }

  private editDistDP(str1: string, str2: string) {
    const m = str1.length;
    const n = str2.length;
    const table = [];

    for (let i = 0; i <= m; i++) {
      table.push([]);
      for (let j = 0; j <= n; j++) {
        table[i].push(0);
      }
    }

    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= n; j++) {
        if (i == 0) {
          table[i][j] = j;
        } else if (j == 0) {
          table[i][j] = i;
        } else if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          table[i][j] = table[i - 1][j - 1];
        } else {
          table[i][j] =
            1 +
            Math.min(
              table[i][j - 1],
              Math.min(table[i - 1][j], table[i - 1][j - 1])
            );
        }
      }
    }

    return table[m][n];
  }

  private static normalize(x: number): number {
    // return 1 - Math.pow(1.001, -x)
    return x / (x + 1);
  }
}
