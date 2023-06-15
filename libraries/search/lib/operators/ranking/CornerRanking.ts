/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";

/**
 * Sort the population using Corner Sort described in Pareto Corner Search Evolutionary Algorithm's
 * (PCSEA) paper.
 *
 * @param population The population to sort
 * @param objectiveFunctions The objectives to consider
 * @param desiredPopulationSize The number of best ranked solutions to be chosen from the population
 * @returns The new population sorted on CornerSort procedure described on PCSEA paper.
 *
 * @author Emin Alp Guneri
 */
export function cornerSort<T extends Encoding>(
  population: T[],
  objectiveFunctions: Set<ObjectiveFunction<T>>,
  desiredPopulationSize: number
): T[] {
  const numberObjectives: number = objectiveFunctions.size;
  const numberSolutions: number = population.length;
  const objectiveFunctionsArray: ObjectiveFunction<T>[] = [
    ...objectiveFunctions.values(),
  ];
  const sortedLists = getSortedLists(
    numberObjectives,
    objectiveFunctionsArray,
    numberSolutions,
    population
  );

  const rankings: number[] = <number[]>(
    Array.from({ length: numberSolutions }).fill(-1)
  );
  let rankingCounter = 0;
  let rowIndex = 0;
  while (rankingCounter < numberSolutions) {
    let columnIndex = 0;
    while (
      rankingCounter < numberSolutions &&
      columnIndex < 2 * numberObjectives
    ) {
      let chosenSolutionIndex = sortedLists[columnIndex][rowIndex];
      let inc = 0;
      // We skip through the solutions that were already ranked, until we find an unranked solution
      // for the current criterion
      while (rankings[chosenSolutionIndex] >= 0) {
        inc++;
        chosenSolutionIndex = sortedLists[columnIndex][rowIndex + inc];
      }
      rankings[chosenSolutionIndex] = rankingCounter;
      rankingCounter++;
      columnIndex++;
    }
    rowIndex++;
  }

  const solutionRankings: T[] = zip(population, rankings)
    .sort((tuple1: [T, number], tuple2: [T, number]) => tuple1[1] - tuple2[1])
    .map((solutionAndRank) => solutionAndRank[0]);

  return solutionRankings.slice(0, desiredPopulationSize);
}

export function getSortedLists<T extends Encoding>(
  numberObjectives: number,
  objectiveFunctionsArray: ObjectiveFunction<T>[],
  numberSolutions: number,
  population: T[]
): number[][] {
  const sortedLists = [];
  for (let index = 0; index < numberObjectives; index++) {
    const currentObjective: ObjectiveFunction<T> =
      objectiveFunctionsArray[index];
    const objectiveSorting = [
      ...Array.from({ length: numberSolutions }).keys(),
    ].sort(
      (a, b) =>
        population[a].getDistance(currentObjective) -
        population[b].getDistance(currentObjective)
    );
    sortedLists.push(objectiveSorting);
  }

  for (let index = 0; index < numberObjectives; index++) {
    const l2Sorting = [...Array.from({ length: numberSolutions }).keys()].sort(
      (a, b) =>
        computeAllButOneL2Norm(population[a], index, objectiveFunctionsArray) -
        computeAllButOneL2Norm(population[b], index, objectiveFunctionsArray)
    );
    sortedLists.push(l2Sorting);
  }
  return sortedLists;
}

/**
 * For a given solution, compute the L2 Norm (square root of sum of squares) of all objective values,
 * except for one objective.
 * @param solution The given solution
 * @param excludedObjectiveIndex The index of the objective function that is excluded
 * @param objectiveFunctions Array of objective functions
 *
 * @returns The All-But-One L2 Norm of the given solution
 */
export function computeAllButOneL2Norm<T extends Encoding>(
  solution: T,
  excludedObjectiveIndex: number,
  objectiveFunctions: ObjectiveFunction<T>[]
): number {
  let result = 0;
  const numberObjectives = objectiveFunctions.length;
  for (let index = 0; index < numberObjectives; index++) {
    if (index != excludedObjectiveIndex) {
      result += solution.getDistance(objectiveFunctions[index]) ** 2;
    }
  }
  return result;
}

/**
 * Zip two same-length arrays into an array of tuples. Tuple at index i is given by (array1[i], array2[i]).
 * @param array1 Array of solutions
 * @param array2 Array of rankings
 * @returns Array of tuples
 */
export function zip<T>(array1: T[], array2: number[]): [T, number][] {
  return array1.map((k, x) => [k, array2[x]]);
}
