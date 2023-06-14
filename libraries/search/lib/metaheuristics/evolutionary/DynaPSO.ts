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

import { DominanceComparator } from "../../comparators/DominanceComparator";
import { Encoding } from "../../Encoding";
import { EncodingSampler } from "../../EncodingSampler";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";
import { Procreation } from "../../operators/procreation/Procreation";
import { crowdingDistance } from "../../operators/ranking/CrowdingDistance";
import { shouldNeverHappen } from "../../util/diagnostics";

import { EvolutionaryAlgorithm } from "./EvolutionaryAlgorithm";

/**
 * Particle Swarm Optimization algorithm.
 *
 * @author Diego Viero
 */
export class DynaPSO<T extends Encoding> extends EvolutionaryAlgorithm<T> {
  protected static override LOGGER: Logger;
  private W = 0.5;
  private c1 = 0.25;
  private c2 = 0.25;
  private pBestMap: Map<string, T> = undefined; // Map containing best current solution for each particle
  private velocityMap: Map<string, { id: string; value: number }[]> = undefined; // Map containing velocity vectors for each particle
  private objectiveMap: Map<string, ObjectiveFunction<T>> = undefined; // Map objectives
  private allObjectives: ObjectiveFunction<T>[] = [];
  private maximumVelocity: number;
  private minimumVelocity: number;

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);

    this.maximumVelocity = Number.NEGATIVE_INFINITY;
    this.minimumVelocity = Number.POSITIVE_INFINITY;

    DynaPSO.LOGGER = getLogger("DynaPSO");
  }

  protected override _environmentalSelection(size: number): void {
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
    DynaPSO.LOGGER.debug(
      `Number of objectives = ${
        this._objectiveManager.getCurrentObjectives().size
      }`
    );

    const nextPopulation: T[] = []; // Next generation's population

    if (
      this.pBestMap === undefined ||
      this.velocityMap === undefined ||
      this.objectiveMap === undefined ||
      this.allObjectives.length === 0
    )
      this._initializeValues(); // Necessary step since the population is not available in the constructor

    const mutatedPopulation: T[] = this._mutatePopulation(); // Population mutated based on PSO approach

    const F = this.preferenceSortingAlgorithm(
      [...this._population, ...mutatedPopulation], // Merge original and mutated population
      this._objectiveManager.getCurrentObjectives()
    );

    //  From here on it follows the implementation from DynaMOSA
    let remain = Math.max(size, F[0].length);
    let index = 0;

    DynaPSO.LOGGER.debug(`First front size = ${F[0].length}`);

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

  protected _mutatePopulation(): T[] {
    const archive = this.getNonDominatedFront(
      this._objectiveManager.getCurrentObjectives(),
      this._population
    );

    const currentObjectivesMap = new Map(
      [...this._objectiveManager.getCurrentObjectives()].map((objective) => [
        objective.getIdentifier(),
        objective,
      ])
    );

    const mutatedPopulation: T[] = [];

    for (const particle of this._population) {
      const gBest = this._selectGbest(particle, archive);
      const pBest = this._selectPbest(particle);

      this._updateVelocity(particle, pBest, gBest, currentObjectivesMap);

      mutatedPopulation.push(this._updatePosition(particle));
    }

    return mutatedPopulation;
  }

  /** Method used to update the position of a particle.
   *  If the particle has high velocity values, mutation
   *  is more likely to be applied multiple times.
   *
   * @param particle Particle to be mutated
   * @returns The possibly mutated particle
   */
  protected _updatePosition(particle: T): T {
    const velocity = this.velocityMap.get(particle.id);

    // Normalize vector through min-max normalization
    const normalizedVelocity = velocity.map(
      ({ value }) =>
        (value - this.minimumVelocity) /
        (this.maximumVelocity - this.minimumVelocity)
    );

    for (const velocityValue of normalizedVelocity) {
      if (Math.random() > velocityValue) particle.mutate(this._encodingSampler);
    }

    return particle;
  }

  /** Updates velocity of a particle using PSO formula
   *
   * @param particle Particle for which the velocity should be calculated
   * @param pBest Global best solution so far
   * @param gBest Local best solution so far
   */
  protected _updateVelocity(
    particle: T,
    pBest: T,
    gBest: T,
    currentObjectivesMap: Map<string, ObjectiveFunction<T>>
  ): void {
    const r1 = Math.random();
    const r2 = Math.random();

    if (!this.velocityMap.has(particle.id))
      // If current particle doesn't have a velocity, initialize it
      this.velocityMap.set(
        particle.id, // Initiate velocity matrix with zero values
        this.allObjectives.map((objectiveFunction) => ({
          id: objectiveFunction.getIdentifier(),
          value: 0,
        }))
      );

    // Update velocity according to PSO formula
    const newVelocity = this.velocityMap
      .get(particle.id)
      .map(({ id, value }) => {
        // The objective relative to this dimension is in the current objectives
        if (currentObjectivesMap.has(id)) {
          const currentObjective = currentObjectivesMap.get(id);
          const particleDistance = particle.getDistance(currentObjective);
          const pBestDistance = pBest.getDistance(currentObjective);
          const gBestDistance = gBest.getDistance(currentObjective);

          if (
            Number.isNaN(particleDistance) ||
            Number.isNaN(pBestDistance) ||
            Number.isNaN(gBestDistance)
          )
            throw new Error("Distance to objective is NaN");

          return {
            id: id,
            value:
              this.W * value +
              this.c1 * r1 * (pBestDistance - particleDistance) +
              this.c2 * r2 * (gBestDistance - particleDistance),
          };
        } // Objective is not currently considered
        else return { id, value };
      });

    // Update max and min velocity if necessary
    this.maximumVelocity = Math.max(
      ...newVelocity.map((object) => object.value),
      this.maximumVelocity
    );
    this.minimumVelocity = Math.min(
      ...newVelocity.map((object) => object.value),
      this.minimumVelocity
    );

    this.velocityMap.set(particle.id, newVelocity);
  }

  /** Select global best
   *  The method uses the PROB approach explained in the MOPSO paper
   *  by Coello Coello et al.
   *
   * @param particle The particle for which the global best should be selected
   * @param archive  Current archive of non-dominated solutions
   * @returns Global best solution
   */
  protected _selectGbest(particle: T, archive: T[]): T {
    if (archive.includes(particle))
      return this._weightedProbabilitySelection(archive);

    const dominatingParticles = archive.filter(
      (archiveParticle) =>
        DominanceComparator.compare(
          archiveParticle,
          particle,
          this._objectiveManager.getCurrentObjectives()
        ) === -1
    );

    if (dominatingParticles.length === 0)
      throw new Error("The dominating particles list shouldn't be empty");

    return this._weightedProbabilitySelection(dominatingParticles);
  }

  /** Updates current particle local best if the new value
   *  dominates the old one
   *
   * @param particle Particle to be compared with local best
   * @returns Either particle passed as parameter or old local best
   */
  protected _selectPbest(particle: T): T {
    const pbest = this.pBestMap.get(particle.id);

    if (pbest === undefined) {
      // PBest is not in the map, so return passed particle
      this.pBestMap.set(particle.id, particle);
      return particle;
    }

    const flag = DominanceComparator.compare(
      particle,
      this.pBestMap.get(particle.id),
      this._objectiveManager.getCurrentObjectives()
    );

    if (flag === -1) {
      this.pBestMap.set(particle.id, particle);
      return particle;
    }

    return this.pBestMap.get(particle.id);
  }

  /** Method of selecting global best from passed archive,
   *  the method calculates the amount of particles dominated by
   *  each solution in the archive and randomly selects one with
   *  probability inversely proportional to the amount of dominated
   *  particles
   *
   * @param archive Archive of non-dominated solutions
   * @returns A randmoly selected particle from the archive
   */
  protected _weightedProbabilitySelection(archive: T[]): T {
    // Population consists of only non-dominated solutions
    if (archive.length === this._population.length)
      return archive[Math.floor(Math.random() * archive.length)];

    /*
      Creates an array of objects containing the current particle 
      from the archive and the number of particles dominated by it.
    */
    const customArchive = archive.map((archiveParticle) => ({
      particle: archiveParticle,
      dominatedParticles: this._population.filter(
        (particle) =>
          DominanceComparator.compare(
            archiveParticle,
            particle,
            this._objectiveManager.getCurrentObjectives()
          ) === -1
      ).length,
    }));

    const weightsSum = customArchive.reduce(
      (accumulator, { dominatedParticles }) =>
        accumulator + 1 / dominatedParticles,
      0
    );

    // Random number between 0 and weightsSum
    let rand = Math.random() * weightsSum;

    // Inversely proportional weighted probability selection
    for (const particle of customArchive) {
      rand -= 1 / particle.dominatedParticles;
      if (rand <= 0) return particle.particle;
    }

    // Throws error in case weighted selection didn't work.
    throw new Error(
      shouldNeverHappen(
        "This line shouldn't have been reached. Take a look at the weightedProbabilitySelection method"
      )
    );
  }

  /** Initializes velocity map, pBest map and allObjectives list.
   *  The values should ideally be intialized in the constructor,
   *  although in that step the population and objectives are not
   *  yet generated, thus we need this method.
   */
  protected _initializeValues = () => {
    this.allObjectives = [
      ...this._objectiveManager.getUncoveredObjectives(),
      ...this._objectiveManager.getCoveredObjectives(),
    ];

    this.pBestMap = new Map<string, T>();
    this.velocityMap = new Map<string, { id: string; value: number }[]>();

    for (const particle of this._population) {
      this.pBestMap.set(particle.id, particle); // Initiate pBest to current value of each particle

      this.velocityMap.set(
        particle.id, // Initiate velocity matrix with zero values
        this.allObjectives.map((objectiveFunction) => ({
          id: objectiveFunction.getIdentifier(),
          value: 0,
        }))
      );
    }
  };

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
      DynaPSO.LOGGER.debug(
        "It looks like a bug in MOSA: the set of objectives cannot be null"
      );
      return fronts;
    }

    if (objectiveFunctions.size === 0) {
      DynaPSO.LOGGER.debug("Trivial case: no objectives for the sorting");
      return fronts;
    }

    // compute the first front using the Preference Criteria
    const frontZero = this.preferenceCriterion(population, objectiveFunctions);

    for (const individual of frontZero) {
      fronts[0].push(individual);
      individual.setRank(0);
    }

    DynaPSO.LOGGER.debug(`First front size: ${frontZero.length}`);
    DynaPSO.LOGGER.debug(`Pop size: ${this._populationSize}`);
    DynaPSO.LOGGER.debug(`Pop + Off size: ${population.length}`);

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
      remainingSolutions.length > 0
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

    DynaPSO.LOGGER.debug(`Number of fronts : ${fronts.length}`);
    DynaPSO.LOGGER.debug(`Front zero size: ${fronts[0].length}`);
    DynaPSO.LOGGER.debug(`# selected solutions: ${selectedSolutions}`);
    DynaPSO.LOGGER.debug(`Pop size: ${this._populationSize}`);
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
