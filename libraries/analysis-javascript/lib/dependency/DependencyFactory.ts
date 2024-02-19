/*
 * Copyright 2020-2023
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

import { traverse } from "@babel/core";
import * as t from "@babel/types";
import { DependencyFactory as FrameworkDependencyFactory } from "@syntest/analysis";
import { Result, success } from "@syntest/diagnostics";

import { Factory } from "../Factory";

import { DependencyVisitor } from "./DependencyVisitor";

/**
 * Dependency generator for targets.
 */
export class DependencyFactory
  extends Factory
  implements FrameworkDependencyFactory<t.Node>
{
  /**
   * Generate function map for specified target.
   *
   * @param AST The AST of the target
   */
  extract(filePath: string, AST: t.Node): Result<string[]> {
    const visitor = new DependencyVisitor(filePath, this.syntaxForgiving);

    traverse(AST, visitor);

    return success([...visitor.imports]);
  }
}
