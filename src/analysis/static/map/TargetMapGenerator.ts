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

import { traverse } from "@babel/core";
import { TargetVisitor } from "./TargetVisitor";
import { TargetMetaData } from "@syntest/framework";
import { ActionDescription } from "../parsing/ActionDescription";

/**
 * FUNCTION map generator for targets.
 *
 * @author Dimitri Stallenberg
 */
export class TargetMapGenerator {
  /**
   * Generate function map for specified target.
   *
   * @param filePath The filePath of the target
   * @param targetAST The AST of the target
   */
  generate(filePath: string, targetAST: any): {
    targetMap: Map<string, TargetMetaData>;
    functionMap: Map<string, Map<string, ActionDescription>>;
  } {
    const visitor = new TargetVisitor(filePath);

    traverse(targetAST, visitor);

    const targetMap = visitor.targetMap;
    const functionMap = visitor.functionMap;

    return { targetMap, functionMap };
  }
}
