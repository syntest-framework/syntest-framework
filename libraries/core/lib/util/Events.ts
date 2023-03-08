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
    budgetManager: BudgetManager<E>
  ) => void;
  searchInitializationComplete: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    budgetManager: BudgetManager<E>
  ) => void;
  searchStart: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    budgetManager: BudgetManager<E>
  ) => void;
  searchComplete: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    budgetManager: BudgetManager<E>
  ) => void;
  searchIterationStart: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    budgetManager: BudgetManager<E>
  ) => void;
  searchIterationComplete: <E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    budgetManager: BudgetManager<E>
  ) => void;

  targetLoadStart: (targetPool: TargetPool) => void;
  targetLoadComplete: (targetPool: TargetPool) => void;
  sourceResolvingStart: (targetPool: TargetPool) => void;
  sourceResolvingComplete: (targetPool: TargetPool) => void;
  targetResolvingStart: (targetPool: TargetPool) => void;
  targetResolvingComplete: (targetPool: TargetPool) => void;
  functionMapResolvingStart: (targetPool: TargetPool) => void;
  functionMapResolvingComplete: (targetPool: TargetPool) => void;
  dependencyResolvingStart: (targetPool: TargetPool) => void;
  dependencyResolvingComplete: (targetPool: TargetPool) => void;
  controlFlowGraphResolvingStart: (targetPool: TargetPool) => void;
  controlFlowGraphResolvingComplete: <S>(
    targetPool: TargetPool,
    cfg: ControlFlowGraph<S>
  ) => void;
  abstractSyntaxTreeResolvingStart: (targetPool: TargetPool) => void;
  abstractSyntaxTreeResolvingComplete: (targetPool: TargetPool) => void;
};
