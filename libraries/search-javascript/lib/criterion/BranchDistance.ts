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

import {
  BranchDistance as CoreBranchDistance,
  shouldNeverHappen,
} from "@syntest/search";
import { BranchDistanceVisitor } from "./BranchDistanceVisitor";
import { transformSync, traverse } from "@babel/core";
import { defaultBabelOptions } from "@syntest/analysis-javascript";

export class BranchDistance extends CoreBranchDistance {
  calculate(
    _conditionAST: string, // deprecated
    condition: string,
    variables: Record<string, unknown>,
    trueOrFalse: boolean
  ): number {
    if (condition === undefined || variables === undefined) {
      return 1;
    }
    const options: unknown = JSON.parse(JSON.stringify(defaultBabelOptions));

    const ast = transformSync(condition, options).ast;
    const visitor = new BranchDistanceVisitor(variables, !trueOrFalse);

    traverse(ast, visitor);
    const distance = visitor._getDistance(condition);

    if (distance > 1 || distance < 0) {
      throw new Error("Invalid distance!");
    }

    if (Number.isNaN(distance)) {
      throw new TypeError(shouldNeverHappen("BranchDistance"));
    }

    return distance;
  }
}
