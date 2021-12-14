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

import { SearchAlgorithm } from "../SearchAlgorithm";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { EncodingSampler } from "../../EncodingSampler";
import { tournamentSelection } from "../../operators/selection/TournamentSelection";
import { Crossover } from "../../operators/crossover/Crossover";
import { prng } from "../../../util/prng";
import { BudgetManager } from "../../budget/BudgetManager";
import { Properties } from "../../../properties";
import { TerminationManager } from "../../termination/TerminationManager";
import { Encoding } from "../../Encoding";

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
   * The population of the EA.
   * This population is evolved over time and becomes more optimized.
   * @protected
   */
  protected _population: T[];

  /**
   * The size of the population.
   * @protected
   */
  protected _populationSize: number;

  protected _crossover: Crossover<T>;

  /**
   * Constructor.
   *
   * @param objectiveManager The objective manager used by the specific algorithm
   * @param encodingSampler The encoding sampler used by the specific algorithm
   * @param crossover The crossover operator to apply
   * @protected
   */
  protected constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    crossover: Crossover<T>
  ) {
    super(objectiveManager);
    this._encodingSampler = encodingSampler;
    this._population = [];
    this._populationSize = Properties.population_size;
    this._crossover = crossover;
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _initialize(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Promise<void> {
    for (let i = 0; i < Properties.population_size; i++) {
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
    const offspring = this._generateOffspring();
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
   * Generates offspring based on the current population.
   *
   * @protected
   */
  protected _generateOffspring(): T[] {
    const offspring = [];

    const rounds = Math.max(2, Math.round(this._populationSize / 5));

    while (offspring.length < this._populationSize) {
      const parentA = tournamentSelection(this._population, rounds);
      const parentB = tournamentSelection(this._population, rounds);

      if (prng.nextDouble(0, 1) <= Properties.crossover_probability) {
        const [childA, childB] = this._crossover.crossOver(parentA, parentB);

        const testCase1 = childA.copy().mutate(this._encodingSampler);
        offspring.push(testCase1);

        const testCase2 = childB.copy().mutate(this._encodingSampler);
        offspring.push(testCase2);
      } else {
        offspring.push(parentA.copy().mutate(this._encodingSampler));
        offspring.push(parentB.copy().mutate(this._encodingSampler));
      }
    }
    offspring.push(this._encodingSampler.sample());
    return offspring;
  }

  /**
   * Makes a selection of the population based on the environment.
   *
   * @param size The size of the selection
   * @protected
   */
  protected abstract _environmentalSelection(size: number): void;
}
