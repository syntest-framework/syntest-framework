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

import { ExecutionResult } from "./ExecutionResult";
import { ObjectiveFunction } from "./objective/ObjectiveFunction";

/**
 * Encoding of the search problem.
 *
 * @author Mitchell Olsthoorn
 */
export interface Encoding {
  /**
   * Store the distance to an objective for this encoding.
   *
   * @param objectiveFunction The objective
   * @param distance The distance
   */
  setDistance(
    objectiveFunction: ObjectiveFunction<Encoding>,
    distance: number
  ): void;

  /**
   * Return the execution result.
   */
  getExecutionResult(): ExecutionResult;

  /**
   * Store the execution result.
   *
   * @param executionResult The execution result to store
   */
  setExecutionResult(executionResult: ExecutionResult);

  /**
   * Return the length of the encoding/chromosome
   */
  getLength(): number;
}
