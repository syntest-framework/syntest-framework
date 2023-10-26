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

import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";

/**
 * Compute the crowding distance for all individual int the front. This is a
 * variant to the classic crowding distance for many-objective problems, where
 * the extreme of the fronts receive a crowding distance equal to 2.0 while
 * the other solutions have a distance in [0;1]
 *
 * @param front set of individual to consider for the crowding distance
 * @param objectiveFunctions The objectives to consider
 *
 * @author Annibale Panichella
 */
export function crowdingDistance<T extends Encoding>(
  front: T[],
  objectiveFunctions: Set<ObjectiveFunction<T>>
) {
  const size = front.length;

  if (size == 0) return;

  if (size == 1) {
    front[0].setCrowdingDistance(2);
    return;
  }
  if (size == 2) {
    front[0].setCrowdingDistance(2);
    front[1].setCrowdingDistance(2);
    return;
  }

  for (const element of front) {
    element.setCrowdingDistance(0);
  }

  for (const objective of objectiveFunctions) {
    // sort the front in ascending order of fitness value
    const orderedFront = front.sort(function (a, b) {
      return a.getDistance(objective) - b.getDistance(objective);
    });

    const objectiveMin = orderedFront[0].getDistance(objective);
    const objectiveMax = orderedFront[size - 1].getDistance(objective);

    if (objectiveMin == objectiveMax) continue;

    // set crowding distance for extreme points
    orderedFront[0].setCrowdingDistance(
      orderedFront[0].getCrowdingDistance() + 2
    );
    orderedFront[size - 1].setCrowdingDistance(
      orderedFront[size - 1].getCrowdingDistance() + 2
    );

    const denominator = Math.abs(objectiveMin - objectiveMax);

    // set crowding distance for all other points
    for (let index = 1; index < size - 1; index++) {
      let distance =
        orderedFront[index + 1].getDistance(objective) -
        orderedFront[index - 1].getDistance(objective);

      if (denominator != 0) {
        distance = distance / denominator;
        distance += orderedFront[index].getCrowdingDistance();
        orderedFront[index].setCrowdingDistance(distance);
      }
    }
  }
}
