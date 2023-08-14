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

import {
  BudgetManager,
  DominanceComparator,
  Encoding,
  EncodingSampler,
  EvolutionaryAlgorithm,
  ObjectiveFunction,
  ObjectiveManager,
  Procreation,
  TerminationManager,
} from "@syntest/search";

/**
 * Strength Pareto Evolutionary Algorithm 2 (SPEA2) family of search algorithms.
 *
 * Based on : SPEA2: Improving the strength pareto evolutionary algorithm
 * E. Zitzler, M. Laumanns, L. Thiele
 * https://doi.org/10.3929/ETHZ-A-004284029
 */
export abstract class SPEA2Family<
  T extends Encoding
> extends EvolutionaryAlgorithm<T> {
  protected _archive: T[];
  protected _archive_size: number;
  protected _strategy: number;

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number,
    archiveSize: number,
    strategy = 1
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);
    this._archive = [];
    this._archive_size = archiveSize;
    this._strategy = strategy;
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public calculateRawFitnessAdapted1(
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
      for (const objective of objectives) {
        let strengthTemporary = 0;
        for (let index_ = 0; index_ < solutions.length; index_++) {
          if (
            index !== index_ &&
            DominanceComparator.compare(
              solutions[index],
              solutions[index_],
              new Set<ObjectiveFunction<T>>().add(objective)
            ) === -1
          ) {
            strengthTemporary++;
          }
        }

        if (strengthTemporary > strength.get(solutions[index])) {
          strength.set(solutions[index], strengthTemporary);
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

  public calculateRawFitnessAdapted2(
    solutions: T[],
    objectives: Set<ObjectiveFunction<T>>
  ): Map<T, number> {
    const strength = new Map<T, number>();

    for (const solution of solutions) {
      strength.set(solution, 0);
    }
    for (let index = 0; index < solutions.length; index++) {
      for (const objective of objectives) {
        let strengthTemporary = 0;
        for (let index_ = 0; index_ < solutions.length; index_++) {
          if (
            index !== index_ &&
            DominanceComparator.compare(
              solutions[index],
              solutions[index_],
              new Set<ObjectiveFunction<T>>().add(objective)
            ) === -1
          ) {
            strengthTemporary++;
          }
        }

        if (strengthTemporary > strength.get(solutions[index])) {
          strength.set(solutions[index], strengthTemporary);
        }
      }
    }

    return strength;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public calculateRawFitnessAdapted3(
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
      for (const objective of objectives) {
        let strengthTemporary = 0;
        for (let index_ = 0; index_ < solutions.length; index_++) {
          if (
            index !== index_ &&
            DominanceComparator.compare(
              solutions[index],
              solutions[index_],
              new Set<ObjectiveFunction<T>>().add(objective)
            ) === -1
          ) {
            strengthTemporary++;
          }
        }

        strength.set(
          solutions[index],
          strength.get(solutions[index]) + strengthTemporary
        );
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

  public calculateRawFitnessAdapted4(
    solutions: T[],
    objectives: Set<ObjectiveFunction<T>>
  ): Map<T, number> {
    const strength = new Map<T, number>();

    for (const solution of solutions) {
      strength.set(solution, 0);
    }
    for (let index = 0; index < solutions.length; index++) {
      for (const objective of objectives) {
        let strengthTemporary = 0;
        for (let index_ = 0; index_ < solutions.length; index_++) {
          if (
            index !== index_ &&
            DominanceComparator.compare(
              solutions[index],
              solutions[index_],
              new Set<ObjectiveFunction<T>>().add(objective)
            ) === -1
          ) {
            strengthTemporary++;
          }
        }

        strength.set(
          solutions[index],
          strength.get(solutions[index]) + strengthTemporary
        );
      }
    }
    return strength;
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
      if (!Number.isNaN(diff)) {
        sumSquaredDifferences += diff * diff;
      }
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

    let rawFitness: Map<T, number>;
    switch (this._strategy) {
      case 1: {
        rawFitness = this.calculateRawFitness(solutions, objectives);
        break;
      }
      case 2: {
        rawFitness = this.calculateRawFitnessAdapted1(solutions, objectives);
        break;
      }
      case 3: {
        rawFitness = this.calculateRawFitnessAdapted2(solutions, objectives);
        break;
      }
      case 4: {
        rawFitness = this.calculateRawFitnessAdapted3(solutions, objectives);
        break;
      }
      case 5: {
        rawFitness = this.calculateRawFitnessAdapted4(solutions, objectives);
        break;
      }
      // No default
    }

    for (const solution of solutions) {
      const distances = distanceMatrix[solutions.indexOf(solution)];
      const sortedDistances = [...distances].sort((a, b) => a - b);
      const kthDistance = sortedDistances[k];
      const density = 1 / (kthDistance + 2);
      const strength = rawFitness.get(solution);
      const score = strength + density;
      fitness.set(solution, score);

      // TODO make own tournament selection
      // Temporary solution to make it work with their version of tournament selection
      solution.setCrowdingDistance(1 / score);
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

  protected override async _iterate(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Promise<void> {
    const offspring = this._procreation.generateOffspringPopulation(
      this._populationSize,
      this._population
    );

    await this._objectiveManager.evaluateMany(
      offspring,
      budgetManager,
      terminationManager
    );

    // If all objectives are covered, we don't need to rank the population anymore
    // The final test cases are in the archive, rather than the population
    if (!this._objectiveManager.hasObjectives()) {
      return;
    }

    this._population = offspring;
    this._environmentalSelection(this._populationSize);
  }
}
