/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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

import { shouldNeverHappen } from "../../../util/diagnostics";

export abstract class BranchDistance {
  /**
   *  Calculate the branch distance between: covering the branch needed to get a closer approach distance
   *  and the currently covered branch always between 0 and 1
   * @param node
   */
  public calculate(
    conditionAST: string,
    condition: string,
    variables: unknown
  ): number {
    const trueBranch = this._calculate(
      conditionAST,
      condition,
      variables,
      true
    );

    const falseBranch = this._calculate(
      conditionAST,
      condition,
      variables,
      false
    );

    if (trueBranch === falseBranch) {
      throw new Error(shouldNeverHappen("BranchDistance"));
    }

    return Math.max(trueBranch, falseBranch);
  }

  public abstract _calculate(
    conditionAST: string,
    condition: string,
    variables: unknown,
    trueOrFalse: boolean
  ): number;

  /**
   * Calculate the branch distance
   *
   * @param opcode the opcode (the comparison operator)
   * @param left the left values of the comparison (multiple execution traces)
   * @param right the right values of the comparison (multiple execution traces)
   * @param target the side of the branch you want to cover
   */
  public branchDistanceNumeric(
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

  private normalize(x: number): number {
    return x / (x + 1);
  }

  private equalNumeric(left: number[], right: number[]): number {
    let minimum = Number.MAX_VALUE;
    for (let index = 0; index < left.length; index++) {
      minimum = Math.min(minimum, Math.abs(left[index] - right[index]));
    }
    return minimum;
  }

  private notEqualNumeric(left: number[], right: number[]): number {
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

  private greater(left: number[], right: number[]): number {
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

  private smallerEqual(left: number[], right: number[]): number {
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

  private greaterEqual(left: number[], right: number[]): number {
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

  private smaller(left: number[], right: number[]): number {
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
