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
import { DominanceComparator } from "../../comparators/DominanceComparator";
import { Encoding } from "../../Encoding";
import { EncodingSampler } from "../../EncodingSampler";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";
import { Procreation } from "../../operators/procreation/Procreation";

import { EvolutionaryAlgorithm } from "./EvolutionaryAlgorithm";

/**
 * Abstract class for SPEA family of algorithms
 */
export abstract class SPEAIIFamily<
  T extends Encoding
> extends EvolutionaryAlgorithm<T> {
  protected _archive: T[];
  protected _archive_size: number;

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number,
    archiveSize: number
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);
    this._archive = [];
    this._archive_size = archiveSize;
  }

  /**
   * Calculates the raw fitness for each solution in the population.
   * @param solutions - The solutions in the population.
   * @param objectives - The objectives.
   * @returns A Map of the raw fitness values for each solution.
   */
  public calculateRawFitness(
    solutions: T[],
    objectives: Set<ObjectiveFunction<T>>
  ): Map<T, number> {
    const strength = new Map<T, number>();
    const rawFitness = new Map<T, number>();

    for (const solution of solutions) {
      strength.set(solution, 0);
      rawFitness.set(solution, 0);
    }
    for (let index = 0; index < solutions.length; index++) {
      for (let index_ = 0; index_ < solutions.length; index_++) {
        if (
          index !== index_ &&
          DominanceComparator.compare(
            solutions[index],
            solutions[index_],
            objectives
          ) == -1
        ) {
          strength.set(solutions[index], strength.get(solutions[index]) + 1);
        }
      }
    }
    for (let index = 0; index < solutions.length; index++) {
      for (let index_ = 0; index_ < solutions.length; index_++) {
        if (
          index !== index_ &&
          DominanceComparator.compare(
            solutions[index],
            solutions[index_],
            objectives
          ) == -1
        ) {
          rawFitness.set(
            solutions[index_],
            rawFitness.get(solutions[index_]) + strength.get(solutions[index])
          );
        }
      }
    }
    return rawFitness;
  }

  /**
   * Calculates the Euclidean distance between two solutions.
   * @param solution1 - The first solution.
   * @param solution2 - The second solution.
   * @param objectives - The objectives.
   * @returns The Euclidean distance between the two solutions.
   */
  public euclideanDistance(
    solution1: T,
    solution2: T,
    objectives: Set<ObjectiveFunction<T>>
  ): number {
    let sumSquaredDifferences = 0;
    for (const objective of objectives) {
      const diff =
        solution1.getDistance(objective) - solution2.getDistance(objective);
      sumSquaredDifferences += diff * diff;
    }
    return Math.sqrt(sumSquaredDifferences);
  }

  /**
   * Calculates the distance matrix between all pairs of solutions in the population.
   * @param solutions - The solutions in the population.
   * @param objectives - The objectives.
   * @returns A 2D array representing the distance matrix.
   */
  public distanceMatrix(
    solutions: T[],
    objectives: Set<ObjectiveFunction<T>>
  ): number[][] {
    const distanceMatrix: number[][] = [];
    for (let index = 0; index < solutions.length; index++) {
      distanceMatrix[index] = [];
      for (let index_ = 0; index_ < solutions.length; index_++) {
        distanceMatrix[index][index_] = this.euclideanDistance(
          solutions[index],
          solutions[index_],
          objectives
        );
      }
    }
    return distanceMatrix;
  }
  /**
   * Calculates the fitness value for each solution in the population.
   * @param solutions - The solutions in the population.
   * @param k - The value of k for computing k-th distance.
   * @param objectives - The objectives.
   * @returns A Map of the fitness values for each solution.
   */
  public calculateFitness(
    solutions: T[],
    k: number,
    objectives: Set<ObjectiveFunction<T>>
  ): Map<T, number> {
    const fitness = new Map<T, number>();
    const distanceMatrix = this.distanceMatrix(solutions, objectives);
    const rawFitness = this.calculateRawFitness(solutions, objectives);

    for (const solution of solutions) {
      const distances = distanceMatrix[solutions.indexOf(solution)];
      const sortedDistances = [...distances].sort((a, b) => a - b);
      const kthDistance = sortedDistances[k];
      const density = 1 / (kthDistance + 2);
      const strength = rawFitness.get(solution);
      const score = strength + density;
      fitness.set(solution, score);
    }
    return fitness;
  }
  public addBestRemaining(
    fitness: Map<T, number>,
    nextFront: T[],
    size: number
  ): void {
    const dominated: T[] = [...fitness.keys()].filter(
      (key: T) => fitness.get(key) >= 1
    );

    // Sort dominated individuals by their fitness score in ascending order
    dominated.sort((a: T, b: T) => fitness.get(a) - fitness.get(b));

    // Add the best dominated individuals until the desired size is reached
    while (nextFront.length < size && dominated.length > 0) {
      nextFront.push(dominated.shift());
    }
  }

  /**
   * Removes solutions from the set until it equals the archive size. The individual which has the minimum distance to another individual is chosen
   * @param nextFront - The solutions in the population.
   * @param k - The value of k for computing k-th distance.
   * @param size - The size of the archive.
   */
  public truncation(nextFront: T[], k: number, size: number): void {
    const distances: number[] = this.distanceMatrix(
      nextFront,
      this._objectiveManager.getCurrentObjectives()
    ).map((row: number[]) => {
      // Sort the row in ascending order and take the k-th element
      return row.sort((a, b) => a - b)[k];
    });
    while (nextFront.length > size && distances.length > 0) {
      const indexToRemove = distances.indexOf(Math.min(...distances));
      nextFront.splice(indexToRemove, 1);
      distances.splice(indexToRemove, 1);
    }
  }
}
