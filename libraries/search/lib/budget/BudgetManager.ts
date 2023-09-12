/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

import { Budget } from "./Budget";
import { BudgetListener } from "./BudgetListener";
import { BudgetType } from "./BudgetType";

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
  protected _budgets: Map<BudgetType, Budget<T>>;

  constructor() {
    this._budgets = new Map();
  }

  /**
   * Return the available budget as a value from zero to one.
   *
   * Loops over all active budgets to find the one with the lowest budget.
   */
  getBudget(): number {
    // eslint-disable-next-line unicorn/no-array-reduce
    const budget = [...this._budgets.values()].reduce((minBudget, budget) =>
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
    return [...this._budgets.values()].every(
      (budget) => budget.getRemainingBudget() > 0
    );
  }

  /**
   * Add budget to the list of active budgets.
   *
   * @param budget The budget to add
   */
  addBudget(name: BudgetType, budget: Budget<T>): this {
    this._budgets.set(name, budget);
    return this;
  }

  getBudgetObject(name: BudgetType): Budget<T> {
    if (!this._budgets.has(name))
      throw new Error(`Budget with name ${name} does not exist`);

    return this._budgets.get(name);
  }

  /**
   * Remove budget from the list of active budgets.
   *
   * @param budget The budget to remove
   */
  removeBudget(budget: Budget<T>): this {
    const name = [...this._budgets.entries()].find(([, b]) => b === budget)[0];
    this._budgets.delete(name);
    return this;
  }

  /**
   * @inheritDoc
   */
  initializationStarted(): void {
    for (const budget of this._budgets.values()) budget.initializationStarted();
  }

  /**
   * @inheritDoc
   */
  initializationStopped(): void {
    for (const budget of this._budgets.values()) budget.initializationStopped();
  }

  /**
   * @inheritDoc
   */
  searchStarted(): void {
    for (const budget of this._budgets.values()) budget.searchStarted();
  }

  /**
   * @inheritDoc
   */
  searchStopped(): void {
    for (const budget of this._budgets.values()) budget.searchStopped();
  }

  /**
   * @inheritDoc
   */
  iteration(searchAlgorithm: SearchAlgorithm<T>): void {
    for (const budget of this._budgets.values())
      budget.iteration(searchAlgorithm);
  }

  /**
   * @inheritDoc
   */
  evaluation(): void {
    for (const budget of this._budgets.values()) budget.evaluation();
  }
}
