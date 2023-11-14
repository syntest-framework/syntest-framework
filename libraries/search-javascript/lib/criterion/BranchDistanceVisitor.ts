/*
 * Copyright 2020-2023 SynTest contributors
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
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { AbstractSyntaxTreeVisitor } from "@syntest/ast-visitor-javascript";
import {
  IllegalArgumentError,
  ImplementationError,
} from "@syntest/diagnostics";
import { getLogger, Logger } from "@syntest/logging";

const invalidOperator = "Invalid operator!";
export class BranchDistanceVisitor extends AbstractSyntaxTreeVisitor {
  protected static override LOGGER: Logger;

  protected _stringAlphabet: string;

  private _K = 1; // punishment factor

  private _variables: Record<string, unknown>;
  private _inverted: boolean;

  private _valueMap: Map<string, unknown>;
  private _isDistanceMap: Map<string, boolean>;

  constructor(
    syntaxForgiving: boolean,
    stringAlphabet: string,
    variables: Record<string, unknown>,
    inverted: boolean
  ) {
    super("", syntaxForgiving);
    this._stringAlphabet = stringAlphabet;
    this._variables = variables;
    this._inverted = inverted;

    this._valueMap = new Map();
    this._isDistanceMap = new Map();

    BranchDistanceVisitor.LOGGER = getLogger("BranchDistanceVisitor");

    for (const variable of Object.keys(this._variables)) {
      const value = this._variables[variable];
      this._valueMap.set(variable, value);
      this._isDistanceMap.set(variable, false);
    }
  }

  _getDistance(condition: string): number {
    if (!this._valueMap.has(condition) || !this._isDistanceMap.get(condition)) {
      // the value does not exist or is not a distance
      throw new IllegalArgumentError(
        "Cannot get distance from unknown condition",
        { context: { condition: condition } }
      );
    }

    return <number>this._valueMap.get(condition);
  }

  public Statement: (path: NodePath<t.Statement>) => void = (path) => {
    let id: string;
    if (
      path.isConditionalExpression() ||
      path.isIfStatement() ||
      path.isDoWhileStatement() ||
      path.isWhileStatement()
    ) {
      const test = <NodePath<t.Node>>path.get("test");

      test.visit();
      id = test.toString();
    } else if (path.isSwitchCase() || path.isForStatement()) {
      const test = <NodePath<t.Node>>path.get("test");

      if (test) {
        test.visit();
        id = test.toString();
      } else {
        path.skip();
        return;
      }
    } else if (path.isExpressionStatement()) {
      const expression = <NodePath<t.Node>>path.get("expression");
      expression.visit();
      id = expression.toString();
    }

    // TODO for in and for of

    let _distance: number;
    if (this._isDistanceMap.get(id)) {
      _distance = <number>this._valueMap.get(id);
    } else {
      if (this._inverted) {
        _distance = this._valueMap.get(id) ? 1 : 0;
      } else {
        _distance = this._valueMap.get(id) ? 0 : 1;
      }
      _distance = this._normalize(_distance);
    }

    this._isDistanceMap.set(id, true);
    this._valueMap.set(id, _distance);

    path.skip();
  };

  public CallExpression: (path: NodePath<t.CallExpression>) => void = (
    path
  ) => {
    const callee = path.get("callee");

    if (callee.isMemberExpression()) {
      const object = callee.get("object");
      object.visit();
      const property = callee.get("property");

      if (property.isIdentifier()) {
        const objectValue = this._valueMap.get(object.toString());

        // TODO should check if the value is actually a string
        if (typeof objectValue !== "string") {
          return;
        }

        switch (property.node.name) {
          case "endsWith": {
            const argument = path.get("arguments")[0];
            argument.visit();
            const argumentValue = <string>(
              this._valueMap.get(argument.toString())
            );

            const endOfObject =
              objectValue.length > argumentValue.length
                ? objectValue.slice(-argumentValue.length)
                : objectValue;

            this._isDistanceMap.set(path.toString(), true);

            if (this._inverted) {
              if (endOfObject === argumentValue) {
                this._valueMap.set(path.toString(), this._normalize(1));
              } else {
                this._valueMap.set(path.toString(), this._normalize(0));
              }
            } else {
              if (endOfObject === argumentValue) {
                this._valueMap.set(path.toString(), this._normalize(0));
              } else {
                this._valueMap.set(
                  path.toString(),
                  this._normalize(
                    this._realCodedEditDistance(endOfObject, argumentValue)
                  )
                );
              }
            }

            break;
          }
          case "startsWith": {
            const argument = path.get("arguments")[0];
            argument.visit();
            const argumentValue = <string>(
              this._valueMap.get(argument.toString())
            );

            const startOfObject =
              objectValue.length > argumentValue.length
                ? objectValue.slice(0, argumentValue.length)
                : objectValue;

            this._isDistanceMap.set(path.toString(), true);

            if (this._inverted) {
              if (startOfObject === argumentValue) {
                this._valueMap.set(path.toString(), this._normalize(1));
              } else {
                this._valueMap.set(path.toString(), this._normalize(0));
              }
            } else {
              if (startOfObject === argumentValue) {
                this._valueMap.set(path.toString(), this._normalize(0));
              } else {
                this._valueMap.set(
                  path.toString(),
                  this._normalize(
                    this._realCodedEditDistance(startOfObject, argumentValue)
                  )
                );
              }
            }

            break;
          }
          case "includes": {
            const argument = path.get("arguments")[0];
            argument.visit();
            const argumentValue = <string>(
              this._valueMap.get(argument.toString())
            );

            this._isDistanceMap.set(path.toString(), true);

            if (this._inverted) {
              if (objectValue.includes(argumentValue)) {
                this._valueMap.set(path.toString(), this._normalize(1));
              } else {
                this._valueMap.set(path.toString(), this._normalize(0));
              }
            } else {
              if (objectValue.includes(argumentValue)) {
                this._valueMap.set(path.toString(), this._normalize(0));
              } else {
                // search
                if (objectValue.length > argumentValue.length) {
                  let minValue = Number.MAX_VALUE;
                  for (
                    let start = 0;
                    start < objectValue.length - argumentValue.length;
                    start++
                  ) {
                    const substring = objectValue.slice(
                      start,
                      argumentValue.length
                    );

                    minValue = Math.min(
                      minValue,
                      this._realCodedEditDistance(substring, argumentValue)
                    );
                  }

                  this._valueMap.set(
                    path.toString(),
                    this._normalize(minValue)
                  );
                } else {
                  this._valueMap.set(
                    path.toString(),
                    this._normalize(
                      this._realCodedEditDistance(objectValue, argumentValue)
                    )
                  );
                }
              }
            }

            break;
          }
          // No default
        }
      }
    }
  };

  public Literal: (path: NodePath<t.Literal>) => void = (path) => {
    switch (path.node.type) {
      case "NullLiteral": {
        // eslint-disable-next-line unicorn/no-null
        this._valueMap.set(path.toString(), null);

        break;
      }
      case "RegExpLiteral": {
        this._valueMap.set(path.toString(), path.node.pattern);

        break;
      }
      case "TemplateLiteral": {
        // should evaluate the template literal... not really possible with the current setup
        this._valueMap.set(path.toString(), "");

        break;
      }
      default: {
        this._valueMap.set(path.toString(), path.node.value);
      }
    }

    this._isDistanceMap.set(path.toString(), false);
  };

  // public ObjectExpression: (path: NodePath<t.ObjectExpression>) => void = (path) => {
  //   this._valueMap.set(this._getNodeId(path), )
  //   this._isDistanceMap.set(this._getNodeId(path), false);
  // }

  // public Identifier: (path: NodePath<t.Identifier>) => void = (path) => {
  //   if (this._variables[path.node.name] === undefined) {
  //     // we dont know what this variable is...
  //     this._valueMap.set(this._getNodeId(path), undefined);
  //   } else {
  //     this._valueMap.set(
  //       this._getNodeId(path),
  //       this._variables[path.node.name]
  //     );
  //   }
  //   this._isDistanceMap.set(this._getNodeId(path), false);
  // };

  // public MemberExpression: (path: NodePath<t.MemberExpression>) => void = (
  //   path
  // ) => {
  //   const result = generate(path.node);
  //   const value = this._variables[result.code];
  //   // might be undefined
  //   this._valueMap.set(this._getNodeId(path), value);
  //   this._isDistanceMap.set(this._getNodeId(path), false);
  // };
  // public Identifier: (path: NodePath<t.Identifier>) => void = (path) => {
  //   if (this._variables[path.node.name] === undefined) {
  //     // we dont know what this variable is...
  //     // should never happen??
  //     this._valueMap.set(path.toString(), undefined);
  //     throw new ImplementationError(shouldNeverHappen('BranchDistanceVisitor'))
  //   } else {
  //     this._valueMap.set(
  //       path.toString(),
  //       this._variables[path.node.name]
  //     );
  //   }
  //   this._isDistanceMap.set(path.toString(), false);
  // };

  public UpdateExpression: (path: NodePath<t.UpdateExpression>) => void = (
    path
  ) => {
    const argument = path.get("argument");
    argument.visit();

    const argumentValue = <any>this._valueMap.get(argument.toString());

    // should not be distance
    if (this._isDistanceMap.get(argument.toString()) === true) {
      throw new ImplementationError(
        "Argument should not result in distance value!"
      );
    }

    let value: unknown;
    // we update the arguments value afterwards
    if (path.node.prefix) {
      switch (path.node.operator) {
        case "++": {
          value = argumentValue + 1;
          this._valueMap.set(argument.toString(), value);
          break;
        }
        case "--": {
          value = argumentValue - 1;
          this._valueMap.set(argument.toString(), value);
          break;
        }
      }
    } else {
      // postfix so it only happens after the expression is evaluated
      switch (path.node.operator) {
        case "++": {
          value = argumentValue;
          this._valueMap.set(argument.toString(), argumentValue + 1);
          break;
        }
        case "--": {
          value = argumentValue;
          this._valueMap.set(argument.toString(), argumentValue - 1);
          break;
        }
        default: {
          // should be unreachable
          throw new ImplementationError(invalidOperator);
        }
      }
    }

    this._valueMap.set(path.toString(), value);
    this._isDistanceMap.set(path.toString(), false);
    path.skip();
  };

  public UnaryExpression: (path: NodePath<t.UnaryExpression>) => void = (
    path
  ) => {
    const argument = path.get("argument");
    if (path.node.operator === "!") {
      this._inverted = !this._inverted;
    }
    argument.visit();
    if (path.node.operator === "!") {
      this._inverted = !this._inverted;
    }

    const argumentValue = <any>this._valueMap.get(argument.toString());

    const argumentIsDistance = this._isDistanceMap.get(argument.toString());

    if (argumentIsDistance && path.node.operator !== "!") {
      throw new ImplementationError(
        "Argument should not result in distance value!"
      );
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
          value = this._inverted
            ? this._normalize(1 - argumentValue)
            : this._normalize(argumentValue);
        } else {
          if (this._inverted) {
            if (typeof argumentValue === "boolean") {
              value = argumentValue ? 0 : this._normalize(1);
            } else if (typeof argumentValue === "number") {
              value = argumentValue ? 0 : this._normalize(1);
            } else {
              // could be other type
              value = argumentValue ? 0 : this._normalize(Number.MAX_VALUE);
            }
          } else {
            if (typeof argumentValue === "boolean") {
              value = argumentValue ? this._normalize(1) : 0;
            } else if (typeof argumentValue === "number") {
              value = argumentValue
                ? this._normalize(Math.abs(0 - argumentValue))
                : 0;
            } else {
              // could be other type
              value = argumentValue ? this._normalize(Number.MAX_VALUE) : 0;
            }
          }
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
        throw new ImplementationError(invalidOperator);
      }
    }

    if (path.node.operator === "!") {
      this._isDistanceMap.set(path.toString(), true);
    } else {
      this._isDistanceMap.set(path.toString(), false);
    }

    this._valueMap.set(path.toString(), value);
    path.skip();
  };

  public BinaryExpression: (path: NodePath<t.BinaryExpression>) => void = (
    path
  ) => {
    const left = path.get("left");
    const right = path.get("right");

    left.visit();
    right.visit();

    const leftValue = <any>this._valueMap.get(left.toString());
    const rightValue = <any>this._valueMap.get(right.toString());

    if (this._isDistanceMap.get(left.toString())) {
      throw new ImplementationError(
        "Left should not result in distance value!"
      );
    }

    if (this._isDistanceMap.get(right.toString())) {
      throw new ImplementationError(
        "Right should not result in distance value!"
      );
    }
    let operator = path.node.operator;

    if (this._inverted) {
      switch (operator) {
        case "===": {
          operator = "!==";
          break;
        }
        case "==": {
          operator = "!=";
          break;
        }
        case "!==": {
          operator = "===";
          break;
        }
        case "!=": {
          operator = "==";
          break;
        }
        case ">": {
          operator = "<=";
          break;
        }
        case ">=": {
          operator = "<";
          break;
        }
        case "<": {
          operator = ">=";
          break;
        }
        case "<=": {
          operator = ">";
          break;
        }
        // No default
      }
    }

    let value: unknown;
    switch (operator) {
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
          value = Math.abs(leftValue - rightValue);
        } else if (
          typeof leftValue === "string" &&
          typeof rightValue === "string" &&
          !left.toString().startsWith("typeof ") && // typeof x === 'string' (should not be compared as strings (but as enums))
          !right.toString().startsWith("typeof ") // 'string' === typeof x (should not be compared as strings (but as enums))
        ) {
          value = this._realCodedEditDistance(leftValue, rightValue);
        } else if (
          typeof leftValue === "boolean" &&
          typeof rightValue === "boolean"
        ) {
          value = leftValue === rightValue ? 0 : 1;
        } else {
          // TODO type difference?!
          if (operator === "===") {
            value = leftValue === rightValue ? 0 : Number.MAX_VALUE;
          } else {
            value = leftValue == rightValue ? 0 : Number.MAX_VALUE;
          }
        }
        break;
      }
      case "!=":
      // TODO
      case "!==": {
        if (operator === "!==") {
          value = leftValue === rightValue ? 1 : 0;
        } else {
          value = leftValue == rightValue ? 1 : 0;
        }
        break;
      }
      case "in": {
        if (rightValue === undefined || rightValue === null) {
          value = 1; // TODO should this one be inverted?
        } else {
          if (this._inverted) {
            value = leftValue in rightValue ? Number.MAX_VALUE : 0;
          } else {
            value = leftValue in rightValue ? 0 : Number.MAX_VALUE;
          }
        }
        break;
      }
      case "instanceof": {
        if (this._inverted) {
          value =
            rightValue instanceof Object && leftValue instanceof rightValue
              ? Number.MAX_VALUE
              : 0;
        } else {
          value =
            rightValue instanceof Object && leftValue instanceof rightValue
              ? 0
              : Number.MAX_VALUE;
        }
        break;
      }
      case ">": {
        if (typeof leftValue === "number" && typeof rightValue === "number") {
          value = leftValue > rightValue ? 0 : rightValue - leftValue + this._K;
        } else {
          // TODO do this for strings maybe
          // cannot compare types
          value = leftValue > rightValue ? 0 : Number.MAX_VALUE;
        }
        break;
      }
      case "<": {
        if (typeof leftValue === "number" && typeof rightValue === "number") {
          value = leftValue < rightValue ? 0 : leftValue - rightValue + this._K;
        } else {
          // TODO do this for strings maybe
          // cannot compare types
          value = leftValue < rightValue ? 0 : Number.MAX_VALUE;
        }
        break;
      }
      case ">=": {
        if (typeof leftValue === "number" && typeof rightValue === "number") {
          value = leftValue >= rightValue ? 0 : rightValue - leftValue;
        } else {
          // TODO do this for strings maybe
          // cannot compare types
          value = leftValue >= rightValue ? 0 : Number.MAX_VALUE;
        }
        break;
      }
      case "<=": {
        if (typeof leftValue === "number" && typeof rightValue === "number") {
          value = leftValue <= rightValue ? 0 : leftValue - rightValue;
        } else {
          // TODO do this for strings maybe
          // cannot compare types
          value = leftValue <= rightValue ? 0 : Number.MAX_VALUE;
        }
        break;
      }
      case "|>": {
        // pipeline operator idk what to do with this
        value = 0;
        break;
      }
      default: {
        // should be unreachable
        throw new ImplementationError(invalidOperator);
      }
    }

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
      ].includes(operator)
    ) {
      value = this._normalize(<number>value);
      this._isDistanceMap.set(path.toString(), true);
    } else {
      this._isDistanceMap.set(path.toString(), false);
    }
    this._valueMap.set(path.toString(), value);

    path.skip();
  };

  public LogicalExpression: (path: NodePath<t.LogicalExpression>) => void = (
    path
  ) => {
    let operator = path.node.operator;

    const left = path.get("left");
    const right = path.get("right");

    if (this._inverted) {
      if (operator === "||") {
        operator = "&&";
      } else if (operator === "&&") {
        operator = "||";
      }
    }

    left.visit();
    right.visit();

    let leftValue = <any>this._valueMap.get(left.toString());
    let rightValue = <any>this._valueMap.get(right.toString());

    if (!this._isDistanceMap.get(left.toString())) {
      // should we check for number /booleans here?
      if (this._inverted) {
        if (typeof leftValue === "boolean") {
          leftValue = leftValue ? this._normalize(1) : 0;
        } else if (typeof leftValue === "number") {
          leftValue = leftValue ? this._normalize(Math.abs(0 - leftValue)) : 0;
        } else {
          leftValue = leftValue ? this._normalize(Number.MAX_VALUE) : 0;
        }
      } else {
        if (typeof leftValue === "boolean") {
          leftValue = leftValue ? 0 : this._normalize(1);
        } else if (typeof leftValue === "number") {
          leftValue = leftValue ? 0 : this._normalize(1);
        } else {
          leftValue = leftValue ? 0 : this._normalize(Number.MAX_VALUE);
        }
      }
    }

    if (!this._isDistanceMap.get(right.toString())) {
      // should we check for number /booleans here?
      if (this._inverted) {
        if (typeof rightValue === "boolean") {
          rightValue = rightValue ? this._normalize(1) : 0;
        } else if (typeof rightValue === "number") {
          rightValue = rightValue
            ? this._normalize(Math.abs(0 - rightValue))
            : 0;
        } else {
          rightValue = rightValue ? this._normalize(Number.MAX_VALUE) : 0;
        }
      } else {
        if (typeof rightValue === "boolean") {
          rightValue = rightValue ? 0 : this._normalize(1);
        } else if (typeof rightValue === "number") {
          rightValue = rightValue ? 0 : this._normalize(1);
        } else {
          rightValue = rightValue ? 0 : this._normalize(Number.MAX_VALUE);
        }
      }
    }

    let value: unknown;
    switch (operator) {
      case "||": {
        value = Math.min(leftValue, rightValue); // should this be normalized?
        break;
      }
      case "&&": {
        value = this._normalize(leftValue + rightValue); // should this be normalized?
        break;
      }
      case "??": {
        // TODO no clue
        value = this._normalize(Number.MAX_VALUE);
        break;
      }
      default: {
        // should be unreachable
        throw new ImplementationError(invalidOperator);
      }
    }

    this._valueMap.set(path.toString(), value);
    this._isDistanceMap.set(path.toString(), true);

    path.skip();
  };

  private minimum(a: number, b: number, c: number) {
    let mi;

    mi = a;
    if (b < mi) {
      mi = b;
    }

    if (c < mi) {
      mi = c;
    }
    return mi;
  }

  public _realCodedEditDistance(s: string, t: string) {
    const d: number[][] = []; // matrix
    let index; // iterates through s
    let index_; // iterates through t
    let s_index; // ith character of s
    let t_index; // jth character of t
    let cost; // cost

    if (s == undefined && t != undefined) {
      return t.length;
    }
    if (t == undefined && s != undefined) {
      return s.length;
    }
    if (s == undefined && t == undefined) {
      return Number.MAX_VALUE;
    }
    // Step 1

    const n = s.length; // length of s
    const m = t.length; // length of t
    if (n == 0) {
      return m;
    }
    if (m == 0) {
      return n;
    }

    for (let indexA = 0; indexA < n + 1; indexA++) {
      const row = [];
      for (let indexB = 0; indexB < m + 1; indexB++) {
        row.push(0);
      }
      d.push(row);
    }

    // Step 2

    for (index = 0; index <= n; index++) {
      d[index][0] = index;
    }

    for (index_ = 0; index_ <= m; index_++) {
      d[0][index_] = index_;
    }

    // Step 3

    for (index = 1; index <= n; index++) {
      s_index = s.charAt(index - 1);

      // Step 4

      for (index_ = 1; index_ <= m; index_++) {
        t_index = t.charAt(index_ - 1);

        // Step 5

        if (s_index == t_index) {
          cost = 0;
        } else {
          //
          if (
            !this._stringAlphabet.includes(t_index) ||
            !this._stringAlphabet.includes(s_index)
          ) {
            BranchDistanceVisitor.LOGGER.warn(
              `Cannot search for character missing from the sampling alphabet one of these is missing: ${t_index}, ${s_index}`
            );
            cost = Number.MAX_VALUE;
          } else {
            cost = Math.abs(
              this._stringAlphabet.indexOf(s_index) -
                this._stringAlphabet.indexOf(t_index)
            );
          }
          cost = this._normalize(cost);
        }

        // Step 6

        d[index][index_] = this.minimum(
          d[index - 1][index_] + 1,
          d[index][index_ - 1] + 1,
          d[index - 1][index_ - 1] + cost
        );
      }
    }

    // Step 7

    return d[n][m];
  }

  protected _editDistDP(string1: string, string2: string) {
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
    if (Number.isNaN(x)) {
      return 0.999;
    }
    // return 1 - Math.pow(1.001, -x)
    return x / (x + 1);
  }
}
