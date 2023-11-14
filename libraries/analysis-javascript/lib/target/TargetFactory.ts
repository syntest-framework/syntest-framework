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

import * as path from "node:path";

import { traverse } from "@babel/core";
import * as t from "@babel/types";
import { TargetFactory as FrameworkTargetFactory } from "@syntest/analysis";
import { Result, success } from "@syntest/diagnostics";

import { Factory } from "../Factory";

import { ExportVisitor } from "./export/ExportVisitor";
import { Target } from "./Target";
import { TargetVisitor } from "./TargetVisitor";

/**
 * TargetFactory for Javascript.
 */
export class TargetFactory
  extends Factory
  implements FrameworkTargetFactory<t.Node>
{
  /**
   * Generate function map for specified target.
   *
   * @param filePath The filePath of the target
   * @param AST The AST of the target
   */
  extract(filePath: string, AST: t.Node): Result<Target> {
    // bit sad that we have to do this twice, but we need to know the exports
    const exportVisitor = new ExportVisitor(filePath, this.syntaxForgiving);

    traverse(AST, exportVisitor);

    const exports = exportVisitor.exports;
    const visitor = new TargetVisitor(filePath, this.syntaxForgiving, exports);

    traverse(AST, visitor);

    // we should check wether every export is actually used
    // TODO

    return success({
      path: filePath,
      name: path.basename(filePath),
      subTargets: visitor.subTargets,
    });
  }
}
