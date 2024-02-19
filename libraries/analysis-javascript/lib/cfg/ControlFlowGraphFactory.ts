/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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
import { ControlFlowGraphFactory as FrameworkControlFlowGraphFactory } from "@syntest/analysis";
import { contractControlFlowProgram, ControlFlowProgram } from "@syntest/cfg";
import { Result } from "@syntest/diagnostics";

import { Factory } from "../Factory";

import { ControlFlowGraphVisitor } from "./ControlFlowGraphVisitor";

export class ControlFlowGraphFactory
  extends Factory
  implements FrameworkControlFlowGraphFactory<t.Node>
{
  convert(filePath: string, AST: t.Node): Result<ControlFlowProgram> {
    const visitor = new ControlFlowGraphVisitor(filePath, this.syntaxForgiving);
    traverse(AST, visitor);

    return contractControlFlowProgram(visitor.cfg);
  }
}
