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

import { EvolutionaryAlgorithm } from "../EvolutionaryAlgorithm";
import { EncodingSampler } from "../../../EncodingSampler";
import { EncodingRunner } from "../../../EncodingRunner";
import { UncoveredObjectiveManager } from "../../../objective/managers/UncoveredObjectiveManager";
import { ObjectiveFunction } from "../../../objective/ObjectiveFunction";
import { crowdingDistance } from "../../../operators/ranking/CrowdingDistance";
import { DominanceComparator } from "../../../comparators/DominanceComparator";
import { getUserInterface } from "../../../../ui/UserInterface";
import { Crossover } from "../../../operators/crossover/Crossover";
import { Encoding } from "../../../Encoding";

/**
 * Many-objective Sorting Algorithm (MOSA).
 *
 * Based on:
 * Reformulating Branch Coverage as a Many-Objective Optimization Problem
 * A. Panichella; F. K. Kifetew; P. Tonella
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 */
export class MOSA<T extends Encoding> extends EvolutionaryAlgorithm<T> {
  constructor(
    encodingSampler: EncodingSampler<T>,
    runner: EncodingRunner<T>,
    crossover: Crossover<T>
  ) {
    super(new UncoveredObjectiveManager<T>(runner), encodingSampler, crossover);
  }

  protected _environmentalSelection(size: number): void {
    if (
      this._objectiveManager.getCurrentObjectives().size == 0 &&
      this._objectiveManager.getUncoveredObjectives().size != 0
    )
      throw Error(
        "This should never happen. There is a likely bug in the objective manager"
      );

    if (
      this._objectiveManager.getCurrentObjectives().size == 0 &&
      this._objectiveManager.getUncoveredObjectives().size == 0
    )
      return; // the search should end

    // non-dominated sorting
    getUserInterface().debug(
      "Number of objectives = " +
        this._objectiveManager.getCurrentObjectives().size
    );

    const F = this.preferenceSortingAlgorithm(
      this._population,
      this._objectiveManager.getCurrentObjectives()
    );

    // select new population
    const nextPopulation = [];
    let remain = Math.max(size, F[0].length);
    let index = 0;

    getUserInterface().debug("First front size = " + F[0].length);

    // Obtain the next front
    let currentFront: T[] = F[index];

    while (remain > 0 && remain >= currentFront.length) {
      // Assign crowding distance to individuals
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

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
      // front contains individuals to insert
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

      currentFront = currentFront.sort(function (a: T, b: T) {
        // sort in descending order of crowding distance
        return b.getCrowdingDistance() - a.getCrowdingDistance();
      });

      for (const individual of currentFront) {
        if (remain == 0) break;

        nextPopulation.push(individual);
        remain--;
      }
    }

    this._population = nextPopulation;
  }

  /**
   * See: Preference sorting as discussed in the TSE paper for DynaMOSA
   *
   * @param population
   * @param objectiveFunctions
   */
  public preferenceSortingAlgorithm(
    population: T[],
    objectiveFunctions: Set<ObjectiveFunction<T>>
  ): T[][] {
    const fronts: T[][] = [[]];

    if (objectiveFunctions === null) {
      getUserInterface().debug(
        "It looks like a bug in MOSA: the set of objectives cannot be null"
      );
      return fronts;
    }

    if (objectiveFunctions.size === 0) {
      getUserInterface().debug("Trivial case: no objectives for the sorting");
      return fronts;
    }

    // compute the first front using the Preference Criteria
    const frontZero = this.preferenceCriterion(population, objectiveFunctions);

    for (const individual of frontZero) {
      fronts[0].push(individual);
      individual.setRank(0);
    }

    getUserInterface().debug("First front size :" + frontZero.length);
    getUserInterface().debug("Pop size :" + this._populationSize);
    getUserInterface().debug("Pop + Off size :" + population.length);

    // compute the remaining non-dominated Fronts
    const remainingSolutions: T[] = population;
    for (const selected of frontZero) {
      const index = remainingSolutions.indexOf(selected);
      remainingSolutions.splice(index, 1);
    }

    let selectedSolutions = frontZero.length;
    let frontIndex = 1;

    while (
      selectedSolutions < this._populationSize &&
      remainingSolutions.length != 0
    ) {
      const front: T[] = this.getNonDominatedFront(
        objectiveFunctions,
        remainingSolutions
      );
      fronts[frontIndex] = front;
      for (const solution of front) {
        solution.setRank(frontIndex);
      }

      for (const selected of front) {
        const index = remainingSolutions.indexOf(selected);
        remainingSolutions.splice(index, 1);
      }

      selectedSolutions += front.length;

      frontIndex += 1;
    }

    getUserInterface().debug("Number of fronts :" + fronts.length);
    getUserInterface().debug("Front zero size :" + fronts[0].length);
    getUserInterface().debug("# selected solutions :" + selectedSolutions);
    getUserInterface().debug("Pop size :" + this._populationSize);
    return fronts;
  }

  /**
   * It retrieves the front of non-dominated solutions from a list
   */
  public getNonDominatedFront(
    uncoveredObjectives: Set<ObjectiveFunction<T>>,
    remainingSolutions: T[]
  ): T[] {
    const front: T[] = [];
    let isDominated: boolean;

    for (const current of remainingSolutions) {
      isDominated = false;
      const dominatedSolutions: T[] = [];
      for (const best of front) {
        const flag = DominanceComparator.compare(
          current,
          best,
          uncoveredObjectives
        );
        if (flag == -1) {
          dominatedSolutions.push(best);
        }
        if (flag == +1) {
          isDominated = true;
        }
      }

      if (isDominated) continue;

      for (const dominated of dominatedSolutions) {
        const index = front.indexOf(dominated);
        front.splice(index, 1);
      }

      front.push(current);
    }
    return front;
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
        if (
          population[index].getDistance(objective) <
          chosen.getDistance(objective)
        )
          // if lower fitness, than it is better
          chosen = population[index];
        else if (
          population[index].getDistance(objective) ==
          chosen.getDistance(objective)
        ) {
          // at the same level of fitness, we look at test case size
          if (population[index].getLength() < chosen.getLength()) {
            // Secondary criterion based on tests lengths
            chosen = population[index];
          }
        }
      }

      // MOSA preference criterion: the best for a target gets Rank 0
      chosen.setRank(0);
      if (!frontZero.includes(chosen)) frontZero.push(chosen);
    }
    return frontZero;
  }
}
