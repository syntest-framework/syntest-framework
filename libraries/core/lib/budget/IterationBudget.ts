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

import { getLogger } from "@syntest/logging";
import { Logger } from "winston";

import { Encoding } from "../Encoding";

import { Budget } from "./Budget";

/**
 * Budget for the number of iterations performed during the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class IterationBudget<T extends Encoding> implements Budget<T> {
  protected static LOGGER: Logger;

  /**
   * The current number of iterations.
   * @protected
   */
  protected _currentIterations: number;

  /**
   * The maximum number of iterations allowed.
   * @protected
   */
  protected readonly _maxIterations: number;

  /**
   * If the budget is tracking progress
   * @protected
   */
  protected _tracking: boolean;

  /**
   * Constructor.
   *
   * @param maxIterations The maximum number of iterations of this budget
   */
  constructor(maxIterations = Number.MAX_SAFE_INTEGER) {
    IterationBudget.LOGGER = getLogger("IterationBudget");
    this._currentIterations = 0;
    this._maxIterations = maxIterations;
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
    IterationBudget.LOGGER.silly("reset");
    this._currentIterations = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  initializationStarted(): void {
    IterationBudget.LOGGER.silly("initializationStarted");
  }

  /**
   * @inheritDoc
   */
  initializationStopped(): void {
    IterationBudget.LOGGER.silly("initializationStopped");
  }

  /**
   * @inheritDoc
   */
  searchStarted(): void {
    IterationBudget.LOGGER.silly("searchStarted");
    this._tracking = true;
  }

  /**
   * @inheritDoc
   */
  searchStopped(): void {
    IterationBudget.LOGGER.silly("searchStopped");
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  iteration(): void {
    IterationBudget.LOGGER.silly("iteration");
    if (this._tracking && this._currentIterations < this._maxIterations) {
      this._currentIterations++;
    }
  }

  /**
   * @inheritDoc
   */
  evaluation(): void {
    IterationBudget.LOGGER.silly("evaluation");
  }
}
