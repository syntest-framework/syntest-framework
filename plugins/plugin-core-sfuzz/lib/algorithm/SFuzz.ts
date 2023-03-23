/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core sFuzz plugin.
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
  Encoding,
  MOSAFamily,
  EncodingSampler,
  ObjectiveManager,
  Procreation,
  shouldNeverHappen,
} from "@syntest/core";
import { getLogger } from "@syntest/logging";

/**
 * sFuzz
 *
 * Based on:
 * sFuzz: An Efficient Adaptive Fuzzer for Solidity Smart Contracts
 * Tai D. Nguyen, Long H. Pham, Jun Sun, Yun Lin, Quang Tran Minh
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 */
export class SFuzz<T extends Encoding> extends MOSAFamily<T> {
  static LOGGER = getLogger("sFuzz");

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);
  }

  protected _environmentalSelection(): void {
    if (
      this._objectiveManager.getCurrentObjectives().size == 0 &&
      this._objectiveManager.getUncoveredObjectives().size != 0
    )
      throw Error(shouldNeverHappen("objective manager"));

    if (
      this._objectiveManager.getCurrentObjectives().size == 0 &&
      this._objectiveManager.getUncoveredObjectives().size == 0
    )
      return; // the search should end

    // non-dominated sorting
    SFuzz.LOGGER.debug(
      "Number of objectives = " +
        this._objectiveManager.getCurrentObjectives().size
    );

    const F = this.preferenceSortingAlgorithm(
      this._population,
      this._objectiveManager.getCurrentObjectives()
    );

    SFuzz.LOGGER.debug("First front size = " + F[0].length);

    // select new population
    this._population = F[0];
  }
}
