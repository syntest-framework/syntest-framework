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
import {
  BranchObjectiveFunction,
  BudgetManager,
  BudgetType,
  Encoding,
  ExceptionObjectiveFunction,
  FunctionObjectiveFunction,
  ImplicitBranchObjectiveFunction,
  SearchAlgorithm,
  SearchSubject,
} from "@syntest/search";

import { Model } from "./Model";

export interface SearchProgressModel extends Model {
  iteration: number;
  evaluation: number;
  searchTime: number;
  totalTime: number;

  coveredPaths: number;
  coveredBranches: number;
  coveredExceptions: number;
  coveredFunctions: number;
  coveredLines: number;
  coveredImplicitBranches: number;
  coveredObjectives: number;

  totalPaths: number;
  totalBranches: number;
  totalExceptions: number;
  totalFunctions: number;
  totalLines: number;
  totalImplicitBranches: number;
  totalObjectives: number;
}

export function searchProgressModelFormatter<E extends Encoding>(
  searchAlgorithm: SearchAlgorithm<E>,
  subject: SearchSubject<E>,
  budgetManager: BudgetManager<E>
): SearchProgressModel {
  const iterations = budgetManager
    .getBudgetObject(BudgetType.ITERATION)
    .getUsedBudget();
  const evaluations = budgetManager
    .getBudgetObject(BudgetType.EVALUATION)
    .getUsedBudget();
  let searchTime = budgetManager
    .getBudgetObject(BudgetType.SEARCH_TIME)
    .getUsedBudget();
  let totalTime = budgetManager
    .getBudgetObject(BudgetType.TOTAL_TIME)
    .getUsedBudget();

  searchTime = Math.round(searchTime * 1000) / 1000;
  totalTime = Math.round(totalTime * 1000) / 1000;

  const covered = [
    ...searchAlgorithm.getObjectiveManager().getCoveredObjectives(),
  ];
  const uncovered = [
    ...searchAlgorithm.getObjectiveManager().getUncoveredObjectives(),
  ];

  // record covered
  const coveredPaths = 0;
  const coveredBranches = covered.filter(
    (objectiveFunction) => objectiveFunction instanceof BranchObjectiveFunction
  ).length;
  const coveredFunctions = covered.filter(
    (objectiveFunction) =>
      objectiveFunction instanceof FunctionObjectiveFunction
  ).length;
  const coveredExceptions = covered.filter(
    (objectiveFunction) =>
      objectiveFunction instanceof ExceptionObjectiveFunction
  ).length;
  const coveredLines = 0;
  const coveredImplicitBranches = covered.filter(
    (objectiveFunction) =>
      objectiveFunction instanceof ImplicitBranchObjectiveFunction
  ).length;
  const coveredObjectives = covered.length;

  // record totals
  const totalPaths = 0;
  const totalBranches =
    coveredBranches +
    uncovered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof BranchObjectiveFunction
    ).length;
  const totalFunctions =
    coveredFunctions +
    uncovered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof FunctionObjectiveFunction
    ).length;
  const totalExceptions =
    coveredExceptions +
    uncovered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof ExceptionObjectiveFunction
    ).length;
  const totalLines = 0;
  const totalImplicitBranches =
    coveredImplicitBranches +
    uncovered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof ImplicitBranchObjectiveFunction
    ).length;
  const totalObjectives = coveredObjectives + uncovered.length;

  return {
    iteration: iterations,
    evaluation: evaluations,
    searchTime: searchTime,
    totalTime: totalTime,

    coveredPaths,
    coveredBranches,
    coveredExceptions,
    coveredFunctions,
    coveredLines,
    coveredImplicitBranches,
    coveredObjectives,

    totalPaths,
    totalBranches,
    totalExceptions,
    totalFunctions,
    totalLines,
    totalImplicitBranches,
    totalObjectives,
  };
}
