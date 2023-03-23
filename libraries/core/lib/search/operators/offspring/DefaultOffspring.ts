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

import { prng } from "../../../util/prng";
import { Encoding } from "../../Encoding";
import { tournamentSelection } from "../selection/TournamentSelection";
import { Offspring } from "./Offspring";

export class DefaultOffspring<E extends Encoding> extends Offspring<E> {
  generateOffspringPopulation(populationSize: number, population: E[]): E[] {
    const offspring = [];

    const rounds = Math.max(2, Math.round(populationSize / 5));

    while (offspring.length < populationSize) {
      const parentA = tournamentSelection(population, rounds);
      const parentB = tournamentSelection(population, rounds);

      if (
        prng.nextDouble(0, 1) <= this.crossover.crossoverEncodingProbability
      ) {
        const children = this.crossover.crossOver([parentA, parentB]);

        for (const child of children) {
          offspring.push(child.copy().mutate(this.sampler));
        }
      } else {
        offspring.push(parentA.copy().mutate(this.sampler));
        offspring.push(parentB.copy().mutate(this.sampler));
      }
    }
    offspring.push(this.sampler.sample());
    return offspring;
  }
}
