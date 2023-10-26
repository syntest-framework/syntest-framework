/*
 * Copyright 2020-2021 SynTest contributors
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

import { getLogger, Logger } from "@syntest/logging";

import { SearchAlgorithm } from "../algorithms/SearchAlgorithm";
import { Encoding } from "../Encoding";

import { Budget } from "./Budget";

/**
 * Budget for the number of iteration performed without progress during the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class StagnationBudget<T extends Encoding> implements Budget<T> {
  protected static LOGGER: Logger;

  /**
   * The current number of iterations without progress.
   * @protected
   */
  protected _currentIterations: number;

  /**
   * The maximum number of evaluations allowed without progress.
   * @protected
   */
  protected readonly _maxIterations: number;

  /**
   * The best progress seen so far.
   * @protected
   */
  protected _bestProgress: number;

  /**
   * If the budget is tracking progress
   * @protected
   */
  protected _tracking: boolean;

  /**
   * Constructor.
   *
   * @param maxIterations The maximum number of iterations without progress of this budget
   */
  constructor(maxIterations = Number.MAX_SAFE_INTEGER) {
    StagnationBudget.LOGGER = getLogger("StagnationBudget");
    this._currentIterations = 0;
    this._maxIterations = maxIterations;
    this._bestProgress = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  getRemainingBudget(): number {
    return this._maxIterations - this._currentIterations;
  }

  /**
   * @inheritDoc
   */
  getUsedBudget(): number {
    return this._currentIterations;
  }

  /**
   * @inheritDoc
   */
  getTotalBudget(): number {
    return this._maxIterations;
  }

  /**
   * @inheritDoc
   */
  reset(): void {
    StagnationBudget.LOGGER.silly("reset");
    this._currentIterations = 0;
    this._bestProgress = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  initializationStarted(): void {
    StagnationBudget.LOGGER.silly("initializationStarted");
  }

  /**
   * @inheritDoc
   */
  initializationStopped(): void {
    StagnationBudget.LOGGER.silly("initializationStopped");
  }

  /**
   * @inheritDoc
   */
  searchStarted(): void {
    StagnationBudget.LOGGER.silly("searchStarted");
    this._tracking = true;
  }

  /**
   * @inheritDoc
   */
  searchStopped(): void {
    StagnationBudget.LOGGER.silly("searchStopped");
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  iteration(searchAlgorithm: SearchAlgorithm<T>): void {
    StagnationBudget.LOGGER.silly("iteration");
    if (this._tracking && this._currentIterations < this._maxIterations) {
      if (searchAlgorithm.progress("branch") > this._bestProgress) {
        this._currentIterations = 0;
      } else {
        this._currentIterations++;
      }
    }
  }

  /**
   * @inheritDoc
   */
  evaluation(): void {
    StagnationBudget.LOGGER.silly("evaluation");
  }
}
