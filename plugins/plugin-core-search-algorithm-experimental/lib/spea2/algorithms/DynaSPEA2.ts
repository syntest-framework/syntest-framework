/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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

import { Encoding, ObjectiveFunction } from "@syntest/search";

import { SPEA2Family } from "./SPEA2Family";

/**
 * Strength Pareto Evolutionary Algorithm 2 (SPEA2)
 */
export class DynaSPEA2<T extends Encoding> extends SPEA2Family<T> {
  /**
   * Performs environmental selection on the current population.
   * @param size - the size of the next population
   * @protected
   */
  protected _environmentalSelection(size: number): void {
    const totalPopulation: T[] = [...this._population, ...this._archive];
    // First add all solutions closest to the objectives, then fill remaining spots with normal environmental selection
    const frontZero: T[] = this.preferenceCriterion(
      totalPopulation,
      this._objectiveManager.getCurrentObjectives()
    );
    if (frontZero.length == this._archive_size) {
      this._archive = frontZero;
      this._population = frontZero;
      return;
    }
    const remainingPopulation: T[] = totalPopulation.filter(
      (individual) => !frontZero.includes(individual)
    );
    const remainingSize = this._archive_size - frontZero.length;
    // 1. Copy all non-dominated individuals
    // 2. If archive is exactly full stop
    // 3. If too little, add best dominated individuals
    // 4. If too many, remove solution with smallest k-th distance

    //TODO Test if k size needs to be changed because remainingPopulation is < this._population.size

    // const k = Math.floor(Math.sqrt(size + this._archive_size));
    const k = Math.floor(Math.sqrt(size + remainingSize));
    const fitness: Map<T, number> = this.calculateFitness(
      [...remainingPopulation],
      k,
      this._objectiveManager.getCurrentObjectives()
    );

    // All solutions with fitness <1 are non-dominated
    const nextFront: T[] = [...fitness.keys()].filter(
      (key: T) => fitness.get(key) < 1
    );

    // If there are not enough non-dominated solutions, add the best remaining solutions
    if (nextFront.length < remainingSize) {
      this.addBestRemaining(fitness, nextFront, remainingSize);
    } else if (nextFront.length > remainingSize) {
      this.truncation(nextFront, k, remainingSize);
    }
    this._archive = [...frontZero, ...nextFront];

    this._population = [...frontZero, ...nextFront];
  }

  /**
   * Preference criterion in MOSA: for each objective, we select the test case closer to cover it.
   *
   * @param population
   * @param objectives list of objective to consider
   * @protected
   */
  public preferenceCriterion(
    population: T[],
    objectives: Set<ObjectiveFunction<T>>
  ): T[] {
    const frontZero: T[] = [];
    for (const objective of objectives) {
      let chosen = population[0];

      for (let index = 1; index < population.length; index++) {
        const lowerFitness =
          population[index].getDistance(objective) <
          chosen.getDistance(objective);
        const sameFitness =
          population[index].getDistance(objective) ==
          chosen.getDistance(objective);
        const smallerEncoding =
          population[index].getLength() < chosen.getLength();

        // If lower fitness, then it is better
        // If same fitness, then we look at test case size
        // Secondary criterion based on tests lengths
        if (lowerFitness || (sameFitness && smallerEncoding)) {
          chosen = population[index];
        }
      }

      // MOSA preference criterion: the best for a target gets Rank 0
      chosen.setRank(0);
      if (!frontZero.includes(chosen)) frontZero.push(chosen);
    }
    // Set rank of every solution not in frontZero to 1, for tournament selection
    for (const p of population) {
      if (!frontZero.includes(p)) {
        p.setRank(1);
      }
    }
    return frontZero;
  }
}
