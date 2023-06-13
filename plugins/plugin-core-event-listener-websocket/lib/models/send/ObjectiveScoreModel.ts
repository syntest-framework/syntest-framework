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
import {
  BudgetManager,
  BudgetType,
  Encoding,
  ObjectiveFunction,
  ObjectiveManager,
  TerminationManager,
} from "@syntest/search";

import { Model } from "./Model";

export interface ObjectiveScoreModel extends Model {
  iteration: number;
  evaluation: number;
  searchTime: number;
  totalTime: number;

  archiveSize: number;
  covered: string[];
  current: string[];
  uncovered: string[];

  distance: number;

  encodingId: string;
  objectiveFunctionId: string;
  subjectName: string;
  subjectPath: string;
}

export function objectiveScoreModelFormatter<E extends Encoding>(
  objectiveManager: ObjectiveManager<E>,
  encoding: E,
  budgetManager: BudgetManager<E>,
  terminationManager: TerminationManager,
  objectiveFunction: ObjectiveFunction<E>,
  distance: number
): ObjectiveScoreModel {
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

  return {
    iteration: iterations,
    evaluation: evaluations,
    searchTime: searchTime,
    totalTime: totalTime,

    archiveSize: objectiveManager.getArchive().size,
    covered: [...objectiveManager.getCoveredObjectives()].map((objective) =>
      objective.getIdentifier()
    ),
    current: [...objectiveManager.getCurrentObjectives()].map((objective) =>
      objective.getIdentifier()
    ),
    uncovered: [...objectiveManager.getUncoveredObjectives()].map((objective) =>
      objective.getIdentifier()
    ),

    distance: distance,
    encodingId: encoding.id,
    objectiveFunctionId: objectiveFunction.getIdentifier(),
    subjectName: objectiveFunction.getSubject().name,
    subjectPath: objectiveFunction.getSubject().path,
  };
}
