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

import { ObjectiveFunction } from "../../objective/ObjectiveFunction";
import { Encoding } from "../../Encoding";

/**
 * Sort the population using fast non-dominated sorting.
 *
 * @param population the population to sort
 * @param objectiveFunctions The objectives to consider
 * @returns {[]} the newly sorted population
 *
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export function fastNonDomSorting<T extends Encoding>(
  population: T[],
  objectiveFunctions: Set<ObjectiveFunction<T>>
) {
  const S: { [id: string]: T[] } = {};
  const F: T[][] = [[]];
  const n: { [id: string]: number } = {};
  const indices: { [id: string]: number } = {};

  for (let index = 0; index < population.length; index++) {
    const p = population[index];
    indices[p.id] = index;
    const Sp: T[] = [];
    S[index] = Sp;
    n[index] = 0;
    for (const q of population) {
      let pDominatesQ = true;
      let qDominatesP = true;
      for (const key of objectiveFunctions) {
        if (p.getDistance(key)! === 0 && q.getDistance(key)! === 0) {
          continue;
        }
        if (p.getDistance(key)! >= q.getDistance(key)!) {
          pDominatesQ = false;
        }

        if (p.getDistance(key)! <= q.getDistance(key)!) {
          qDominatesP = false;
        }
      }

      if (pDominatesQ) {
        Sp.push(q);
      } else if (qDominatesP) {
        n[index] += 1;
      }
    }

    if (n[index] === 0) {
      F[0].push(p);
    }
  }

  let i = 0;
  while (F[i].length !== 0) {
    const H = [];
    for (const p of F[i]) {
      for (const q of S[indices[p.id]]) {
        n[indices[q.id]] -= 1;
        if (n[indices[q.id]] === 0) {
          H.push(q);
        }
      }
    }
    i += 1;
    F.push(H);
  }

  // let's save the ranks
  let index = 0;
  for (const front of F) {
    for (const p of front) {
      p.setRank(index);
    }
    index++;
  }

  return F;
}
