/*
 * Copyright 2020-2023 SynTest contributors
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

import { SearchAlgorithm } from "./algorithms/SearchAlgorithm";
import { BudgetManager } from "./budget/BudgetManager";
import { Encoding } from "./Encoding";
import { SearchSubject } from "./SearchSubject";
import { TerminationManager } from "./termination/TerminationManager";

export type Events = {
  searchInitializationStart: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    subject: SearchSubject<E>,
    budgetManager: BudgetManager<E>,
    terminationManager: TerminationManager
  ) => void;
  searchInitializationComplete: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    subject: SearchSubject<E>,
    budgetManager: BudgetManager<E>,
    terminationManager: TerminationManager
  ) => void;
  searchStart: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    subject: SearchSubject<E>,
    budgetManager: BudgetManager<E>,
    terminationManager: TerminationManager
  ) => void;
  searchComplete: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    subject: SearchSubject<E>,
    budgetManager: BudgetManager<E>,
    terminationManager: TerminationManager
  ) => void;
  searchIterationStart: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    subject: SearchSubject<E>,
    budgetManager: BudgetManager<E>,
    terminationManager: TerminationManager
  ) => void;
  searchIterationComplete: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    subject: SearchSubject<E>,
    budgetManager: BudgetManager<E>,
    terminationManager: TerminationManager
  ) => void;
};
