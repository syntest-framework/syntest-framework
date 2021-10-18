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

/**
 * Budget for the search time of the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class SearchTimeBudget<T extends Encoding> implements Budget<T> {
  /**
   * The current number of seconds.
   * @protected
   */
  protected _currentSearchTime: number;

  /**
   * The maximum number of seconds allowed.
   * @protected
   */
  protected _maxSearchTime: number;

  /**
   * The time the tracking started.
   * @protected
   */
  protected _counterTime: number;

  /**
   * If the budget is tracking progress
   * @protected
   */
  protected _tracking: boolean;

  /**
   * Constructor.
   *
   * @param maxSearchTime The maximum allowed time in seconds this budget should use
   */
  constructor(maxSearchTime = Number.MAX_SAFE_INTEGER) {
    this._currentSearchTime = 0;
    this._maxSearchTime = maxSearchTime;
    this._counterTime = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  getRemainingBudget(): number {
    if (this.getUsedBudget() > this._maxSearchTime) {
      console.log(
        `Consumed ${
          this.getUsedBudget() - this._maxSearchTime
        }s over the allocated search time`
      );
    }

    return Math.max(this._maxSearchTime - this.getUsedBudget(), 0);
  }

  /**
   * @inheritDoc
   */
  getUsedBudget(): number {
    if (this._tracking) {
      const currentTime = Date.now() / 1000;
      return this._currentSearchTime + (currentTime - this._counterTime);
    } else {
      return this._currentSearchTime;
    }
  }

  /**
   * @inheritDoc
   */
  getTotalBudget(): number {
    return this._maxSearchTime;
  }

  /**
   * @inheritDoc
   */
  reset(): void {
    this._currentSearchTime = 0;
    this._counterTime = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initializationStarted(): void {}

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initializationStopped(): void {}

  /**
   * @inheritDoc
   */
  searchStarted(): void {
    if (!this._tracking) {
      this._counterTime = Date.now() / 1000;
      this._tracking = true;
    }
  }

  /**
   * @inheritDoc
   */
  searchStopped(): void {
    if (this._tracking) {
      this._currentSearchTime = this.getUsedBudget();
      this._counterTime = 0;
      this._tracking = false;
    }
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  iteration(searchAlgorithm: SearchAlgorithm<T>): void {}

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  evaluation(encoding: T): void {}
}
