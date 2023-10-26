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

import { prng } from "@syntest/prng";

import { Encoding } from "../../Encoding";
import { tournamentSelection } from "../selection/TournamentSelection";

import { Procreation } from "./Procreation";

export class DefaultProcreation<E extends Encoding> extends Procreation<E> {
  generateOffspringPopulation(populationSize: number, population: E[]): E[] {
    const offspring: E[] = [];

    const rounds = Math.max(2, Math.round(populationSize / 5));

    while (offspring.length < populationSize) {
      const parentA = tournamentSelection(population, rounds);
      const parentB = tournamentSelection(population, rounds);

      if (
        prng.nextDouble(0, 1) <= this.crossover.crossoverEncodingProbability
      ) {
        const children = this.crossover.crossOver([parentA, parentB]);

        for (const child of children) {
          offspring.push(this.mutateFunction(this.sampler, child));
        }
      } else {
        offspring.push(
          this.mutateFunction(this.sampler, parentA),
          this.mutateFunction(this.sampler, parentB)
        );
      }
    }
    for (let index = 0; index < Math.ceil(populationSize * 0.2); index++) {
      offspring.push(this.sampler.sample());
    }

    return offspring;
  }
}
