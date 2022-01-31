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

import { ObjectiveFunction } from "../objective/ObjectiveFunction";
import { Encoding } from "../Encoding";

export class DominanceComparator {
  /**
   * Fast Dominance Comparator as discussed in
   * "Automated Test Case Generation as a Many-Objective Optimisation Problem with Dynamic
   *  Selection of the Targets"
   */
  static compare<T extends Encoding>(
    individual1: T,
    individual2: T,
    objectives: Set<ObjectiveFunction<T>>
  ): number {
    let dominatesX = false;
    let dominatesY = false;

    for (const objective of objectives) {
      if (
        individual1.getDistance(objective) < individual2.getDistance(objective)
      )
        dominatesX = true;
      if (
        individual1.getDistance(objective) > individual2.getDistance(objective)
      )
        dominatesY = true;

      // if the both do not dominates each other, we don't
      // need to iterate over all the other objectives
      if (dominatesX && dominatesY) return 0;
    }

    if (dominatesX == dominatesY) return 0;
    else if (dominatesX) return -1;
    else dominatesY;
    return +1;
  }
}
