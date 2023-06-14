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
import { getLogger, Logger } from "@syntest/logging";

import { Encoding } from "../../Encoding";
import { EncodingSampler } from "../../EncodingSampler";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";
import { Procreation } from "../../operators/procreation/Procreation";
import { crowdingDistance } from "../../operators/ranking/CrowdingDistance";
import { shouldNeverHappen } from "../../util/diagnostics";

import { RVEA } from "./RVEA";

export class RVEAMOSA<T extends Encoding> extends RVEA<T> {
  protected static override LOGGER: Logger;

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number
    // referenceVector: number[][] = generateReferenceVectors()
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);
    // this._referenceVector = referenceVector;
    RVEAMOSA.LOGGER = getLogger("RVEAMOSA");
  }

  protected override _environmentalSelection(
    size: number,
    alpha: number,
    progress: number,
    fr: number
  ): void {
    if (
      this._objectiveManager.getCurrentObjectives().size === 0 &&
      this._objectiveManager.getUncoveredObjectives().size > 0
    )
      throw new Error(shouldNeverHappen("Objective Manager"));

    if (
      this._objectiveManager.getCurrentObjectives().size === 0 &&
      this._objectiveManager.getUncoveredObjectives().size === 0
    )
      return; // the search should end

    // non-dominated sorting
    RVEAMOSA.LOGGER.debug(
      `Number of objectives = ${
        this._objectiveManager.getCurrentObjectives().size
      }`
    );

    //TODO: Why do we compute all fronts even if it could be possible that F0 is already enough?
    const F = this.preferenceSortingAlgorithm(
      this._population,
      this._objectiveManager.getCurrentObjectives(),
      size,
      alpha,
      progress,
      fr
    );

    // select new population
    const nextPopulation = [];
    let remain = Math.max(size, F[0].length);
    let index = 0;

    RVEAMOSA.LOGGER.debug(`First front size = ${F[0].length}`);

    // Obtain the next front
    let currentFront: T[] = F[index];

    const withCrowdingDistance = false;

    while (remain > 0 && remain >= currentFront.length) {
      //TODO: Ask if I should keep crowding distance or not?

      // Assign crowding distance to individuals
      currentFront = this.assignCrowdingDistanceAndSort(
        withCrowdingDistance,
        currentFront,
        false
      );
      // if (withCrowdingDistance) {
      //     crowdingDistance(
      //         currentFront,
      //         this._objectiveManager.getCurrentObjectives()
      //     );
      // } else {
      //     for (const solution of currentFront) {
      //         solution.setCrowdingDistance(0);
      //     }
      // }

      // Add the individuals of this front
      nextPopulation.push(...currentFront);

      // Decrement remain
      remain = remain - currentFront.length;

      // Obtain the next front
      index++;

      currentFront = F[index];
    }

    // Remain is less than front(index).size, insert only the best one
    if (remain > 0 && currentFront.length > 0) {
      //TODO: Ask if I should keep crowding distance or not?

      // front contains individuals to insert
      currentFront = this.assignCrowdingDistanceAndSort(
        withCrowdingDistance,
        currentFront,
        true
      );

      for (const individual of currentFront) {
        if (remain == 0) break;

        nextPopulation.push(individual);
        remain--;
      }
    }

    this._population = nextPopulation;
  }

  private assignCrowdingDistanceAndSort(
    withCrowdingDistance: boolean,
    currentFront: T[],
    doSort: boolean
  ): T[] {
    if (withCrowdingDistance) {
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

      if (doSort) {
        currentFront = currentFront.sort(function (a: T, b: T) {
          // sort in descending order of crowding distance
          return b.getCrowdingDistance() - a.getCrowdingDistance();
        });
      }
    } else {
      for (const solution of currentFront) {
        solution.setCrowdingDistance(0);
      }
    }
    return currentFront;
  }

  /**
   * See: Preference sorting as discussed in the TSE paper for DynaMOSA
   *
   * @param population
   * @param objectiveFunctions
   */
  public preferenceSortingAlgorithm(
    population: T[],
    objectiveFunctions: Set<ObjectiveFunction<T>>,
    size: number,
    alpha: number,
    progress: number,
    fr: number
  ): T[][] {
    const fronts: T[][] = [[]];

    if (objectiveFunctions === null) {
      RVEAMOSA.LOGGER.debug(
        "It looks like a bug in MOSA: the set of objectives cannot be null"
      );
      return fronts;
    }

    if (objectiveFunctions.size === 0) {
      RVEAMOSA.LOGGER.debug("Trivial case: no objectives for the sorting");
      return fronts;
    }

    // compute the first front using the Preference Criteria
    const frontZero = this.preferenceCriterion(population, objectiveFunctions);

    for (const individual of frontZero) {
      fronts[0].push(individual);
      individual.setRank(0);
    }

    RVEAMOSA.LOGGER.debug(`First front size: ${frontZero.length}`);
    RVEAMOSA.LOGGER.debug(`Pop size: ${this._populationSize}`);
    RVEAMOSA.LOGGER.debug(`Pop + Off size: ${population.length}`);

    // compute the remaining non-dominated Fronts
    const remainingSolutions: T[] = population;
    for (const selected of frontZero) {
      const index = remainingSolutions.indexOf(selected);
      remainingSolutions.splice(index, 1);
    }

    let selectedSolutions = frontZero.length;
    let frontIndex = 1;

    let remainingSolutionsLength = remainingSolutions.length;
    //TODO: Should I adapt population size since some solutions are removed because of F0?
    const M = objectiveFunctions.size;
    const numberOfReferenceVectors = Math.max(M * 2, size);
    this.weights = this.referenceVectors(
      this.referencePoints(M, numberOfReferenceVectors)
    );
    this.neighbours = this.nearestNeighbors(this.weights);
    const apd_fronts = this.referenceVectorGuidedSelection(
      M,
      remainingSolutions,
      objectiveFunctions,
      this.weights,
      this.neighbours,
      size,
      progress,
      alpha,
      true
    );
    let apdFrontIndex = 0;

    RVEA.LOGGER.debug(
      `The referenceVectorGuidesSelection produced a population (apd_fronts) of the size ${apd_fronts.length}.`
    );

    RVEAMOSA.LOGGER.debug(
      `The frequency at which we adapt reference vectors is ${fr}, but we are not using it in DynaMOSA.`
    );

    while (
      selectedSolutions < this._populationSize &&
      remainingSolutionsLength > 0
    ) {
      const front: T[] = apd_fronts[apdFrontIndex];
      fronts[frontIndex] = front;

      for (const solution of apd_fronts[apdFrontIndex]) {
        solution.setRank(frontIndex);
      }

      selectedSolutions += front.length;
      remainingSolutionsLength -= front.length;

      frontIndex += 1;
      apdFrontIndex += 1;
    }

    // while (selectedSolutions < this._populationSize && remainingSolutions.length > 0) {
    //
    //     const front: T[] = this.getNonDominatedFront(objectiveFunctions, remainingSolutions);
    //     fronts[frontIndex] = front;
    //
    //     for (const solution of front) {
    //         solution.setRank(frontIndex);
    //     }
    //
    //     for (const selected of front) {
    //         const index = remainingSolutions.indexOf(selected);
    //         remainingSolutions.splice(index, 1);
    //     }
    //
    //     selectedSolutions += front.length;
    //
    //     frontIndex += 1;
    // }

    RVEAMOSA.LOGGER.debug(`Number of fronts : ${fronts.length}`);
    RVEAMOSA.LOGGER.debug(`Front zero size: ${fronts[0].length}`);
    RVEAMOSA.LOGGER.debug(`# selected solutions: ${selectedSolutions}`);
    RVEAMOSA.LOGGER.debug(`Pop size: ${this._populationSize}`);
    return fronts;
  }

  /**
   * Preference criterion in MOSA: for each objective, we select the test case closer to cover it.
   *
   * @param population
   * @param objectives list of objective to consider
   * @protected
   */
  public preferenceCriterion(
    population: T[],
    objectives: Set<ObjectiveFunction<T>>
  ): T[] {
    const frontZero: T[] = [];
    for (const objective of objectives) {
      let chosen = population[0];

      for (let index = 1; index < population.length; index++) {
        const lowerFitness =
          population[index].getDistance(objective) <
          chosen.getDistance(objective);
        const sameFitness =
          population[index].getDistance(objective) ==
          chosen.getDistance(objective);
        const smallerEncoding =
          population[index].getLength() < chosen.getLength();

        // If lower fitness, then it is better
        // If same fitness, then we look at test case size
        // Secondary criterion based on tests lengths
        if (lowerFitness || (sameFitness && smallerEncoding)) {
          chosen = population[index];
        }
      }

      // MOSA preference criterion: the best for a target gets Rank 0
      chosen.setRank(0);
      if (!frontZero.includes(chosen)) frontZero.push(chosen);
    }
    return frontZero;
  }
}
