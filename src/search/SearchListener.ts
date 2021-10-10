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

import { Encoding } from "./Encoding";
import { SearchAlgorithm } from "./metaheuristics/SearchAlgorithm";
import { BudgetManager } from "./budget/BudgetManager";
import { TerminationManager } from "./termination/TerminationManager";

export interface SearchListener<T extends Encoding> {
  /**
   * Signal the search process has started.
   *
   * @param searchAlgorithm The search algorithm
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  searchStarted(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;

  /**
   * Signal the search initialization is done.
   *
   * @param searchAlgorithm The search algorithm
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  initializationDone(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;

  /**
   * Signal the search process has stopped.
   *
   * @param searchAlgorithm The search algorithm
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  searchStopped(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;

  /**
   * Signal a search iteration happened.
   *
   * @param searchAlgorithm The search algorithm
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  iteration(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;
}
