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

import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";
import { BudgetListener } from "./BudgetListener";

/**
 * Manager for the budget of the search process.
 *
 * Keeps track how much budget is left before the search process has to be terminated.
 *
 * @author Mitchell Olsthoorn
 */
export class BudgetManager<T extends Encoding> implements BudgetListener<T> {
  /**
   * List of currently active budgets.
   * @protected
   */
  protected _budgets: Budget<T>[];

  constructor() {
    this._budgets = [];
  }

  /**
   * Return the available budget as a value from zero to one.
   *
   * Loops over all active budgets to find the one with the lowest budget.
   */
  getBudget(): number {
    const budget = this._budgets.reduce((minBudget, budget) =>
      budget.getRemainingBudget() / budget.getTotalBudget() <
      minBudget.getRemainingBudget() / minBudget.getTotalBudget()
        ? budget
        : minBudget
    );

    const value = (budget.getRemainingBudget() / budget.getTotalBudget()) * 100;
    const factor = 10 ** 2;
    return Math.round(value * factor) / factor;
  }

  /**
   * Return whether the budget manager has any budget left.
   */
  hasBudgetLeft(): boolean {
    return this._budgets.every((budget) => budget.getRemainingBudget() > 0.0);
  }

  /**
   * Add budget to the list of active budgets.
   *
   * @param budget The budget to add
   */
  addBudget(budget: Budget<T>): BudgetManager<T> {
    this._budgets.push(budget);
    return this;
  }

  /**
   * Remove budget from the list of active budgets.
   *
   * @param budget The budget to remove
   */
  removeBudget(budget: Budget<T>): BudgetManager<T> {
    this._budgets.slice(this._budgets.indexOf(budget), 1);
    return this;
  }

  /**
   * @inheritDoc
   */
  initializationStarted(): void {
    this._budgets.forEach((budget) => budget.initializationStarted());
  }

  /**
   * @inheritDoc
   */
  initializationStopped(): void {
    this._budgets.forEach((budget) => budget.initializationStopped());
  }

  /**
   * @inheritDoc
   */
  searchStarted(): void {
    this._budgets.forEach((budget) => budget.searchStarted());
  }

  /**
   * @inheritDoc
   */
  searchStopped(): void {
    this._budgets.forEach((budget) => budget.searchStopped());
  }

  /**
   * @inheritDoc
   */
  iteration(searchAlgorithm: SearchAlgorithm<T>): void {
    this._budgets.forEach((budget) => budget.iteration(searchAlgorithm));
  }

  /**
   * @inheritDoc
   */
  evaluation(encoding: T): void {
    this._budgets.forEach((budget) => budget.evaluation(encoding));
  }
}
