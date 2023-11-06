/*
 * Copyright 2020-2021 SynTest contributors
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

import { getLogger, Logger } from "@syntest/logging";

import { Encoding } from "../Encoding";

import { Budget } from "./Budget";
import { SearchTimeBudget } from "./SearchTimeBudget";

/**
 * Budget for the total time of the search process.
 */
export class TotalTimeBudget<T extends Encoding>
  extends SearchTimeBudget<T>
  implements Budget<T>
{
  protected static override LOGGER: Logger;

  constructor(maxTotalTime = Number.MAX_SAFE_INTEGER) {
    super(maxTotalTime);
    TotalTimeBudget.LOGGER = getLogger("TotalTimeBudget");
  }

  /**
   * @inheritDoc
   */
  override initializationStarted(): void {
    TotalTimeBudget.LOGGER.silly("initializationStarted");
    this.searchStarted();
  }

  /**
   * @inheritDoc
   */
  override initializationStopped(): void {
    TotalTimeBudget.LOGGER.silly("initializationStopped");
    this.searchStopped();
  }
}
