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

import { BudgetManager } from "../../budget/BudgetManager";
import { Encoding } from "../../Encoding";
import { EncodingSampler } from "../../EncodingSampler";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { Procreation } from "../../operators/procreation/Procreation";
import { TerminationManager } from "../../termination/TerminationManager";
import { SearchAlgorithm } from "../SearchAlgorithm";

/**
 * Base class for Evolutionary Algorithms (EA).
 * Uses the T encoding.
 */
export abstract class EvolutionaryAlgorithm<
  T extends Encoding
> extends SearchAlgorithm<T> {
  /**
   * The sampler used to sample new encodings.
   * @protected
   */
  protected _encodingSampler: EncodingSampler<T>;

  /**
   * The size of the population.
   * @protected
   */
  protected _populationSize: number;

  /**
   * The procreation operator to apply.
   */
  protected _procreation: Procreation<T>;

  /**
   * Constructor.
   *
   * @param objectiveManager The objective manager used by the specific algorithm
   * @param encodingSampler The encoding sampler used by the specific algorithm
   * @param crossover The crossover operator to apply
   *
   */
  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number
  ) {
    super(objectiveManager);
    this._encodingSampler = encodingSampler;
    this._procreation = procreation;
    this._populationSize = populationSize;
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _initialize(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Promise<void> {
    for (let index = 0; index < this._populationSize; index++) {
      this._population.push(this._encodingSampler.sample());
    }

    // Evaluate initial population before starting the search loop
    await this._objectiveManager.evaluateMany(
      this._population,
      budgetManager,
      terminationManager
    );

    // Compute ranking and crowding distance
    this._environmentalSelection(this._populationSize);
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _iterate(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Promise<void> {
    const offspring = this._procreation.generateOffspringPopulation(
      this._populationSize,
      this._population
    );

    await this._objectiveManager.evaluateMany(
      offspring,
      budgetManager,
      terminationManager
    );

    // If all objectives are covered, we don't need to rank the population anymore
    // The final test cases are in the archive, rather than the population
    if (!this._objectiveManager.hasObjectives()) {
      return;
    }

    this._population.push(...offspring);
    this._environmentalSelection(this._populationSize);
  }

  /**
   * Makes a selection of the population based on the environment.
   *
   * @param size The size of the selection
   * @protected
   */
  protected abstract _environmentalSelection(size: number): void;
}
