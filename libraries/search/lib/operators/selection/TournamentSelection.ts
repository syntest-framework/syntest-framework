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

import { prng } from "@syntest/prng";

import { Encoding } from "../../Encoding";
import { minimumValue } from "../../util/diagnostics";

/**
 * This function selects the individual for reproduction using tournament selection
 * @param population the population from which to select a parent
 * @param tournamentSize size of the tournament (minimum 2)
 * @returns AbstractTestCase selected individual
 */
export function tournamentSelection<T extends Encoding>(
  population: T[],
  tournamentSize: number
): T {
  if (tournamentSize < 2)
    throw new Error(minimumValue("tournament size", 2, tournamentSize));

  let winner = prng.pickOne(population);

  for (let tournament = 0; tournament < tournamentSize - 1; tournament++) {
    const solution = prng.pickOne(population);

    // The winner is the solution with the best (smaller) non-dominance rank.
    // At the same level or ranking, the winner is the solution with the best (largest)
    // crowding distance.
    if (
      solution.getRank() < winner.getRank() ||
      (solution.getRank() === winner.getRank() &&
        solution.getCrowdingDistance() > winner.getCrowdingDistance())
    ) {
      winner = solution;
    }
  }

  return winner;
}
