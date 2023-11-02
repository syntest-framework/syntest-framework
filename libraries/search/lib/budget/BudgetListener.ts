/*
 * Copyright 2020-2021 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { SearchAlgorithm } from "../algorithms/SearchAlgorithm";
import { Encoding } from "../Encoding";

/**
 * Listener for budget signals.
 *
 * These methods are called from within the search process.
 */
export interface BudgetListener<T extends Encoding> {
  /**
   * Start initialization budget tracking.
   */
  initializationStarted(): void;

  /**
   * Stop initialization budget tracking.
   */
  initializationStopped(): void;

  /**
   * Start search budget tracking.
   */
  searchStarted(): void;

  /**
   * Stop search budget tracking.
   */
  searchStopped(): void;

  /**
   * Signal iteration happened.
   *
   * @param searchAlgorithm The search algorithm
   */
  iteration(searchAlgorithm: SearchAlgorithm<T>): void;

  /**
   * Signal evaluation happened.
   */
  evaluation(): void;
}
