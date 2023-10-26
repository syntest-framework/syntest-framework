/*
 * Copyright 2020-2021 SynTest contributors
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

import { Trace } from "./Trace";

/**
 * Results of an execution by the runner.
 */
export interface ExecutionResult {
  /**
   * Determine if a specific id has been covered in the traces.
   *
   * @param id The id to check for
   */
  coversId(id: string): boolean;

  /**
   * Return the duration of the execution.
   */
  getDuration(): number;

  /**
   * Return error that occurred during the execution.
   */
  getError(): Error;

  /**
   * Return error identifier that occurred during the execution.
   */
  getErrorIdentifier(): string;

  /**
   * Return all the traces produced by the execution.
   */
  getTraces(): Trace[];

  /**
   * Return if an error occurred during the execution.
   */
  hasError(): boolean;

  /**
   * Return if the execution has passed.
   */
  hasPassed(): boolean;

  /**
   * Return if the execution timed out.
   */
  hasTimedOut(): boolean;
}
