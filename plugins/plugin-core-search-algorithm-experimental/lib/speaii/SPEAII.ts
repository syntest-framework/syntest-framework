/*
 * Copyright 2020-2023 SynTest contributors
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
import { Encoding } from "@syntest/search";

import { SPEAIIFamily } from "./SPEAIIFamily";

/**
 * Strength Pareto Evolutionary Algorithm II (SPEAII)
 */
export class SPEAII<T extends Encoding> extends SPEAIIFamily<T> {
  /**
   * Performs environmental selection on the current population.
   * @param size - the size of the next population
   * @protected
   */
  protected _environmentalSelection(size: number): void {
    // 1. Copy all non-dominated individuals
    // 2. If archive is exactly full stop
    // 3. If too little, add best dominated individuals
    // 4. If too many, remove solution with smallest k-th distance
    const k = Math.floor(Math.sqrt(size + this._archive_size));

    const fitness: Map<T, number> = this.calculateFitness(
      [...this._population, ...this._archive],
      k,
      this._objectiveManager.getCurrentObjectives()
    );

    // All solutions with fitness <1 are non-dominated
    const nextFront: T[] = [...fitness.keys()].filter(
      (key: T) => fitness.get(key) < 1
    );

    // If there are not enough non-dominated solutions, add the best dominated solutions
    if (nextFront.length < this._archive_size) {
      this.addBestRemaining(fitness, nextFront, this._archive_size);
    }
    // If there are too many non-dominated solutions, remove the ones that are most similar to maintain diversity
    else if (nextFront.length > this._archive_size) {
      this.truncation(nextFront, k, this._archive_size);
    }
    this._archive = nextFront;

    this._population = nextFront;
  }
}
