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

import { RootContext } from "../analysis/static/RootContext";
import { BudgetManager } from "../search/budget/BudgetManager";
import { Encoding } from "../search/Encoding";
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

  targetLoadStart: (rootContext: RootContext) => void;
  targetLoadComplete: (rootContext: RootContext) => void;
  sourceResolvingStart: (rootContext: RootContext) => void;
  sourceResolvingComplete: (rootContext: RootContext) => void;
  targetResolvingStart: (rootContext: RootContext) => void;
  targetResolvingComplete: (rootContext: RootContext) => void;
  functionMapResolvingStart: (rootContext: RootContext) => void;
  functionMapResolvingComplete: (rootContext: RootContext) => void;
  dependencyResolvingStart: (rootContext: RootContext) => void;
  dependencyResolvingComplete: (rootContext: RootContext) => void;
  controlFlowGraphResolvingStart: (rootContext: RootContext) => void;
  controlFlowGraphResolvingComplete: <S>(
    rootContext: RootContext,
    cfg: ControlFlowGraph<S>
  ) => void;
  abstractSyntaxTreeResolvingStart: (rootContext: RootContext) => void;
  abstractSyntaxTreeResolvingComplete: (rootContext: RootContext) => void;
};
