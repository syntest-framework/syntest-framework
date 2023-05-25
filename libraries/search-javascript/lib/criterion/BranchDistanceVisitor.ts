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

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { AbstractSyntaxTreeVisitor } from "@syntest/ast-visitor-javascript";
import generate from "@babel/generator";

export class BranchDistanceVisitor extends AbstractSyntaxTreeVisitor {
  private _K = 1; // punishment factor

  private _variables: Record<string, unknown>;
  private _valueMap: Map<string, unknown>;
  private _isDistanceMap: Map<string, boolean>;
  private _distance: number;

  constructor(variables: Record<string, unknown>) {
    super("");
    this._variables = variables;
    this._valueMap = new Map();
    this._isDistanceMap = new Map();
    this._distance = -1;
  }

  get distance(): number {
    return this._distance;
  }

  public Statement: (path: NodePath<t.Statement>) => void = (path) => {
    if (
      path.isConditionalExpression() ||
      path.isIfStatement() ||
      path.isDoWhileStatement() ||
      path.isWhileStatement()
    ) {
      const test = <NodePath<t.Node>>path.get("test");

      test.visit();

      const testId = this._getNodeId(test);

      if (this._isDistanceMap.get(testId)) {
        this._distance = <number>this._valueMap.get(this._getNodeId(path));
      } else {
        this._distance = this._valueMap.get(this._getNodeId(path)) ? 0 : 1;
      }
    }

    if (path.isSwitchCase() || path.isForStatement()) {
      const test = <NodePath<t.Node>>path.get("test");

      if (test) {
        test.visit();
        const testId = this._getNodeId(test);

        if (this._isDistanceMap.get(testId)) {
          this._distance = <number>this._valueMap.get(this._getNodeId(path));
        } else {
          this._distance = this._valueMap.get(this._getNodeId(path)) ? 0 : 1;
        }
      } else {
        this._distance = 0;
      }
    }

    if (path.isExpressionStatement()) {
      path.get("expression").visit();

      const expression = <NodePath<t.Node>>path.get("expression");
      const expressionId = this._getNodeId(expression);

      if (this._isDistanceMap.get(expressionId)) {
        this._distance = <number>this._valueMap.get(this._getNodeId(path));
      } else {
        this._distance = this._valueMap.get(this._getNodeId(path)) ? 0 : 1;
      }
    }

    // TODO for in and for of

    path.skip();
  };

  public Literal: (path: NodePath<t.Literal>) => void = (path) => {
    switch (path.node.type) {
      case "NullLiteral": {
        // eslint-disable-next-line unicorn/no-null
        this._valueMap.set(this._getNodeId(path), null);

        break;
      }
      case "RegExpLiteral": {
        this._valueMap.set(this._getNodeId(path), path.node.pattern);

        break;
      }
      case "TemplateLiteral": {
        // should evaluate the template literal... not really possible with the current setup
        this._valueMap.set(this._getNodeId(path), "");

        break;
      }
      default: {
        this._valueMap.set(this._getNodeId(path), path.node.value);
      }
    }

    this._isDistanceMap.set(this._getNodeId(path), false);
  };

  public Identifier: (path: NodePath<t.Identifier>) => void = (path) => {
    if (this._variables[path.node.name] === undefined) {
      // we dont know what this variable is...
      this._valueMap.set(this._getNodeId(path), undefined);
    } else {
      this._valueMap.set(
        this._getNodeId(path),
        this._variables[path.node.name]
      );
    }
    this._isDistanceMap.set(this._getNodeId(path), false);
  };

  public MemberExpression: (path: NodePath<t.MemberExpression>) => void = (
    path
  ) => {
    const result = generate(path.node);
    const value = this._variables[result.code];
    // might be undefined
    this._valueMap.set(this._getNodeId(path), value);
    this._isDistanceMap.set(this._getNodeId(path), false);
  };

  public UpdateExpression: (path: NodePath<t.UpdateExpression>) => void = (
    path
  ) => {
    const argument = path.get("argument");
    argument.visit();

    const argumentValue = <any>this._valueMap.get(this._getNodeId(argument));

    // should not be distance
    if (this._isDistanceMap.get(this._getNodeId(argument)) === true) {
      throw new Error("Argument should not result in distance value!");
    }

    let value: unknown;
    // we update the arguments value afterwards
    if (path.node.prefix) {
      switch (path.node.operator) {
        case "++": {
          value = argumentValue + 1;
          this._valueMap.set(this._getNodeId(argument), value);
          break;
        }
        case "--": {
          value = argumentValue - 1;
          this._valueMap.set(this._getNodeId(argument), value);
          break;
        }
      }
    } else {
      // postfix so it only happens after the expression is evaluated
      switch (path.node.operator) {
        case "++": {
          value = argumentValue;
          this._valueMap.set(this._getNodeId(argument), argumentValue + 1);
          break;
        }
        case "--": {
          value = argumentValue;
          this._valueMap.set(this._getNodeId(argument), argumentValue - 1);
          break;
        }
        default: {
          // should be unreachable
          throw new Error("Invalid operator!");
        }
      }
    }

    this._valueMap.set(this._getNodeId(path), value);
    this._isDistanceMap.set(this._getNodeId(path), false);
    path.skip();
  };

  public UnaryExpression: (path: NodePath<t.UnaryExpression>) => void = (
    path
  ) => {
    const argument = path.get("argument");
    argument.visit();

    const argumentValue = <any>this._valueMap.get(this._getNodeId(argument));

    const argumentIsDistance = this._isDistanceMap.get(
      this._getNodeId(argument)
    );

    if (argumentIsDistance && path.node.operator !== "!") {
      throw new Error("Argument should not result in distance value!");
    }

    let value: unknown;
    switch (path.node.operator) {
      case "void": {
        // TODO no clue
        value = 0;
        break;
      }
      case "throw": {
        // TODO no clue
        value = 0;
        break;
      }
      case "delete": {
        // TODO no clue
        value = 0;
        break;
      }
      case "!": {
        if (argumentIsDistance) {
          value = 1 - argumentValue;
        } else {
          value =
            typeof argumentValue === "number"
              ? this._normalize(Math.abs(0 - argumentValue))
              : argumentValue
              ? 1
              : 0;
        }
        break;
      }
      case "+": {
        value = +argumentValue;
        break;
      }
      case "-": {
        value = -argumentValue;
        break;
      }
      case "~": {
        value = ~argumentValue;
        break;
      }
      case "typeof": {
        value = typeof argumentValue;
        break;
      }
      default: {
        // should be unreachable
        throw new Error("Invalid operator!");
      }
    }

    if (path.node.operator === "!") {
      this._isDistanceMap.set(this._getNodeId(path), true);
    } else {
      this._isDistanceMap.set(this._getNodeId(path), false);
    }

    this._valueMap.set(this._getNodeId(path), value);
    path.skip();
  };

  public BinaryExpression: (path: NodePath<t.BinaryExpression>) => void = (
    path
  ) => {
    const left = path.get("left");
    const right = path.get("right");

    left.visit();
    right.visit();

    const leftValue = <any>this._valueMap.get(this._getNodeId(left));
    const rightValue = <any>this._valueMap.get(this._getNodeId(right));

    if (this._isDistanceMap.get(this._getNodeId(left))) {
      throw new Error("Left should not result in distance value!");
    }

    if (this._isDistanceMap.get(this._getNodeId(right))) {
      throw new Error("Right should not result in distance value!");
    }

    let value: unknown;
    switch (path.node.operator) {
      // values
      case "+": {
        // could also be something else
        value = leftValue + rightValue;
        break;
      }
      case "-": {
        value = leftValue - rightValue;
        break;
      }
      case "/": {
        value = leftValue / rightValue;
        break;
      }
      case "%": {
        value = leftValue % rightValue;
        break;
      }
      case "*": {
        value = leftValue * rightValue;
        break;
      }
      case "**": {
        value = leftValue ** rightValue;
        break;
      }

      case "&": {
        value = leftValue & rightValue;
        break;
      }
      case "|": {
        value = leftValue | rightValue;
        break;
      }
      case ">>": {
        value = leftValue >> rightValue;
        break;
      }
      case ">>>": {
        value = leftValue >>> rightValue;
        break;
      }
      case "<<": {
        value = leftValue << rightValue;
        break;
      }
      case "^": {
        value = leftValue ^ rightValue;
        break;
      }

      // distance
      case "==":
      // TODO
      case "===": {
        if (typeof leftValue === "number" && typeof rightValue === "number") {
          value = this._normalize(Math.abs(leftValue - rightValue));
        } else if (
          typeof leftValue === "string" &&
          typeof rightValue === "string"
        ) {
          value = this._normalize(this._editDistDP(leftValue, rightValue));
        } else if (
          typeof leftValue === "boolean" &&
          typeof rightValue === "boolean"
        ) {
          value = leftValue === rightValue ? 0 : 1;
        } else {
          // TODO type difference?!
          value = leftValue === rightValue ? 0 : 1;
        }
        break;
      }
      case "!=":
      // TODO
      case "!==": {
        value = leftValue === rightValue ? 1 : 0;
        break;
      }
      case "in": {
        if (rightValue === undefined || rightValue === null) {
          value = 1;
        } else {
          value = leftValue in rightValue ? 0 : 1;
        }
        break;
      }
      case "instanceof": {
        value = leftValue instanceof rightValue ? 0 : 1;
        break;
      }
      case ">": {
        value =
          leftValue > rightValue
            ? 0
            : this._normalize(rightValue - leftValue + this._K);
        break;
      }
      case "<": {
        value =
          leftValue < rightValue
            ? 0
            : this._normalize(leftValue - rightValue + this._K);
        break;
      }
      case ">=": {
        value =
          leftValue >= rightValue ? 0 : this._normalize(rightValue - leftValue);
        break;
      }
      case "<=": {
        value =
          leftValue <= rightValue ? 0 : this._normalize(leftValue - rightValue);
        break;
      }
      case "|>": {
        // pipeline operator idk what to do with this
        value = 0;
        break;
      }
      default: {
        // should be unreachable
        throw new Error("Invalid operator!");
      }
    }

    this._valueMap.set(this._getNodeId(path), value);

    if (
      [
        "==",
        "===",
        "!=",
        "!==",
        "in",
        "instanceof",
        ">",
        "<",
        ">=",
        "<=",
        "|>",
      ].includes(path.node.operator)
    ) {
      this._isDistanceMap.set(this._getNodeId(path), true);
    } else {
      this._isDistanceMap.set(this._getNodeId(path), false);
    }

    path.skip();
  };

  public LogicalExpression: (path: NodePath<t.LogicalExpression>) => void = (
    path
  ) => {
    const left = path.get("left");
    const right = path.get("right");

    left.visit();
    right.visit();

    let leftValue = <any>this._valueMap.get(this._getNodeId(left));
    let rightValue = <any>this._valueMap.get(this._getNodeId(right));

    if (!this._isDistanceMap.get(this._getNodeId(left))) {
      leftValue = leftValue ? 0 : 1;
    }

    if (!this._isDistanceMap.get(this._getNodeId(right))) {
      rightValue = rightValue ? 0 : 1;
    }

    let value: unknown;
    switch (path.node.operator) {
      case "||": {
        value = this._normalize(Math.min(leftValue, rightValue));
        break;
      }
      case "&&": {
        value = this._normalize(leftValue + rightValue);
        break;
      }
      case "??": {
        // TODO no clue
        value = 0;
        break;
      }
      default: {
        // should be unreachable
        throw new Error("Invalid operator!");
      }
    }

    this._valueMap.set(this._getNodeId(path), value);
    this._isDistanceMap.set(this._getNodeId(path), true);

    path.skip();
  };

  private _editDistDP(string1: string, string2: string) {
    const m = string1.length;
    const n = string2.length;
    const table = [];

    for (let index = 0; index <= m; index++) {
      table.push([]);
      for (let index_ = 0; index_ <= n; index_++) {
        table[index].push(0);
      }
    }

    for (let index = 0; index <= m; index++) {
      for (let index_ = 0; index_ <= n; index_++) {
        if (index == 0) {
          table[index][index_] = index_;
        } else if (index_ == 0) {
          table[index][index_] = index;
        } else if (string1.charAt(index - 1) === string2.charAt(index_ - 1)) {
          table[index][index_] = table[index - 1][index_ - 1];
        } else {
          table[index][index_] =
            1 +
            Math.min(
              table[index][index_ - 1],
              Math.min(table[index - 1][index_], table[index - 1][index_ - 1])
            );
        }
      }
    }

    return table[m][n];
  }

  /**
   * Based on doi:10.1109/icstw.2011.100
   *
   * @param x
   * @returns
   */
  private _normalize(x: number): number {
    // return 1 - Math.pow(1.001, -x)
    return x / (x + 1);
  }
}
