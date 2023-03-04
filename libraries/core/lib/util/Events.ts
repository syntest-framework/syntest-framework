/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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

import { ControlFlowGraph } from "@syntest/cfg-core";
import { TargetPool } from "../analysis/static/TargetPool";
import { Encoding } from "../search/Encoding";
import { BudgetManager } from "../search/budget/BudgetManager";
import { SearchAlgorithm } from "../search/metaheuristics/SearchAlgorithm";
import { SearchSubject } from "../search/SearchSubject";
import { TerminationManager } from "../search/termination/TerminationManager";

export type Events = {
  initializeStart: () => void;
  initializeComplete: () => void;
  preprocessStart: () => void;
  preprocessComplete: () => void;
  processStart: () => void;
  processComplete: () => void;
  postprocessStart: () => void;
  postprocessComplete: () => void;
  exit: () => void;

  instrumentationStart: () => void;
  instrumentationComplete: () => void;
  targetRunStart: () => void;
  targetRunComplete: () => void;
  reportStart: () => void;
  reportComplete: () => void;

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

  targetLoadStart: <E extends Encoding>(targetPool: TargetPool<E>) => void;
  targetLoadComplete: <E extends Encoding>(targetPool: TargetPool<E>) => void;
  sourceResolvingStart: <E extends Encoding>(targetPool: TargetPool<E>) => void;
  sourceResolvingComplete: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
  targetResolvingStart: <E extends Encoding>(targetPool: TargetPool<E>) => void;
  targetResolvingComplete: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
  functionMapResolvingStart: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
  functionMapResolvingComplete: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
  dependencyResolvingStart: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
  dependencyResolvingComplete: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
  controlFlowGraphResolvingStart: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
  controlFlowGraphResolvingComplete: <E extends Encoding>(
    targetPool: TargetPool<E>,
    cfg: ControlFlowGraph
  ) => void;
  abstractSyntaxTreeResolvingStart: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
  abstractSyntaxTreeResolvingComplete: <E extends Encoding>(
    targetPool: TargetPool<E>
  ) => void;
};
