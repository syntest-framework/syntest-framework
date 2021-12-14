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

import { EvolutionaryAlgorithm } from "./EvolutionaryAlgorithm";
import { crowdingDistance } from "../../operators/ranking/CrowdingDistance";
import { fastNonDomSorting } from "../../operators/ranking/FastNonDomSorting";
import { EncodingSampler } from "../../EncodingSampler";
import { SimpleObjectiveManager } from "../../objective/managers/SimpleObjectiveManager";
import { EncodingRunner } from "../../EncodingRunner";
import { Crossover } from "../../operators/crossover/Crossover";
import { Encoding } from "../../Encoding";

/**
 * Non-dominated Sorting Genetic Algorithm (NSGA-II).
 *
 * Based on:
 * A fast and elitist multiobjective genetic algorithm: NSGA-II
 * K. Deb; A. Pratap; S. Agarwal; T. Meyarivan
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class NSGAII<T extends Encoding> extends EvolutionaryAlgorithm<T> {
  /**
   * Constructor.
   *
   * @param encodingSampler The encoding sampler
   * @param runner The runner
   */
  constructor(
    encodingSampler: EncodingSampler<T>,
    runner: EncodingRunner<T>,
    crossover: Crossover<T>
  ) {
    super(new SimpleObjectiveManager<T>(runner), encodingSampler, crossover);
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected _environmentalSelection(size: number): void {
    const fronts = fastNonDomSorting(
      this._population,
      this._objectiveManager.getCurrentObjectives()
    );
    const nextPopulation = [];
    let remain = size;
    let index = 0;
    let currentFront = fronts[index];
    while (
      remain > 0 &&
      remain >= currentFront.length &&
      !currentFront.length
    ) {
      // Assign crowding distance to individuals
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

      // Add the individuals of this front
      for (const individual of currentFront) {
        if (nextPopulation.length < size) {
          nextPopulation.push(individual);
        }
      }

      // Decrement remain
      remain = remain - currentFront.length;

      // Obtain the next front
      index++;
      if (remain > 0) {
        currentFront = fronts[index];
      }
    }

    // Remain is less than front(index).size, insert only the best one
    if (remain > 0 && currentFront.length > 0) {
      // front contains individuals to insert
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

      currentFront.sort(function (a: T, b: T) {
        // sort in descending order of crowding distance
        return b.getCrowdingDistance() - a.getCrowdingDistance();
      });
      let counter = 0;
      for (const individual of currentFront) {
        if (counter > remain) break;

        nextPopulation.push(individual);
        counter++;
      }
    }

    this._population = nextPopulation;
  }
}
