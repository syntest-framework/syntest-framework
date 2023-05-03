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

import { getLogger, Logger } from "@syntest/logging";

import { Encoding } from "../Encoding";

import { Budget } from "./Budget";

/**
 * Budget for the number of evaluation performed during the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class EvaluationBudget<T extends Encoding> implements Budget<T> {
  protected static LOGGER: Logger;

  /**
   * The current number of evaluations.
   * @protected
   */
  protected _currentEvaluations: number;

  /**
   * The maximum number of evaluations allowed.
   * @protected
   */
  protected readonly _maxEvaluations: number;

  /**
   * If the budget is tracking progress
   * @protected
   */
  protected _tracking: boolean;

  /**
   * Constructor.
   *
   * @param maxEvaluations The maximum number of evaluations of this budget
   */
  constructor(maxEvaluations = Number.MAX_SAFE_INTEGER) {
    EvaluationBudget.LOGGER = getLogger("EvaluationBudget");
    this._currentEvaluations = 0;
    this._maxEvaluations = maxEvaluations;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  getRemainingBudget(): number {
    return this._maxEvaluations - this._currentEvaluations;
  }

  /**
   * @inheritDoc
   */
  getUsedBudget(): number {
    return this._currentEvaluations;
  }

  /**
   * @inheritDoc
   */
  getTotalBudget(): number {
    return this._maxEvaluations;
  }

  /**
   * @inheritDoc
   */
  reset(): void {
    EvaluationBudget.LOGGER.silly("reset");
    this._currentEvaluations = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  initializationStarted(): void {
    EvaluationBudget.LOGGER.silly("initializationStarted");
    this._tracking = true;
  }

  /**
   * @inheritDoc
   */
  initializationStopped(): void {
    EvaluationBudget.LOGGER.silly("initializationStopped");
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  searchStarted(): void {
    EvaluationBudget.LOGGER.silly("searchStarted");
    this._tracking = true;
  }

  /**
   * @inheritDoc
   */
  searchStopped(): void {
    EvaluationBudget.LOGGER.silly("searchStopped");
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  iteration(): void {
    EvaluationBudget.LOGGER.silly("iteration");
  }

  /**
   * @inheritDoc
   */
  evaluation(): void {
    EvaluationBudget.LOGGER.silly("evaluation");
    if (this._tracking && this._currentEvaluations < this._maxEvaluations) {
      this._currentEvaluations++;
    }
  }
}
