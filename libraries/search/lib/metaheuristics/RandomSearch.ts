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

import { BudgetManager } from "../budget/BudgetManager";
import { Encoding } from "../Encoding";
import { EncodingSampler } from "../EncodingSampler";
import { ObjectiveManager } from "../objective/managers/ObjectiveManager";
import { TerminationManager } from "../termination/TerminationManager";

import { SearchAlgorithm } from "./SearchAlgorithm";

/**
 * Random Search algorithm that adds new encodings when these explore a new area of the search domain.
 *
 * @author Mitchell Olsthoorn
 */
export class RandomSearch<T extends Encoding> extends SearchAlgorithm<T> {
  protected static override LOGGER: Logger;
  protected _encodingSampler: EncodingSampler<T>;

  /**
   * Constructor.
   *
   * @param encodingSampler The encoding sampler
   */
  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>
  ) {
    super(objectiveManager);
    RandomSearch.LOGGER = getLogger("RandomSearch");
    this._encodingSampler = encodingSampler;
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected _initialize(): void {
    RandomSearch.LOGGER.debug("Initializing");
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _iterate(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Promise<void> {
    // Sample a new random encoding
    const randomEncoding: T = this._encodingSampler.sample();
    this._population = [randomEncoding];

    // Evaluate the new encoding
    await this._objectiveManager.evaluateMany(
      this._population,
      budgetManager,
      terminationManager
    );
  }
}
