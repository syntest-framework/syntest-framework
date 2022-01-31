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

import { Datapoint } from "../util/Datapoint";

/**
 * Results of an execution by the runner.
 *
 * @author Mitchell Olsthoorn
 */
export interface ExecutionResult {
  /**
   * Determine if a specific line has been covered in the traces.
   *
   * @param line The line to check for
   */
  coversLine(line: number): boolean;

  /**
   * Return the duration of the execution.
   */
  getDuration(): number;

  /**
   * Return all exceptions that occurred during the execution.
   */
  getExceptions();

  /**
   * Return all the traces produced by the execution.
   */
  getTraces(): Datapoint[];

  /**
   * Return if any exceptions occurred during the execution.
   */
  hasExceptions(): boolean;

  /**
   * Return if the execution has passed.
   */
  hasPassed(): boolean;

  /**
   * Return if the execution timed out.
   */
  hasTimedOut(): boolean;
}
