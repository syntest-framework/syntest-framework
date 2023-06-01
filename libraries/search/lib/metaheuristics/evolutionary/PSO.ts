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
import { shouldNeverHappen } from "../../util/diagnostics";

import { EvolutionaryAlgorithm } from "./EvolutionaryAlgorithm";

/**
 * Particle Swarm Optimization algorithm.
 *
 * @author Diego Viero
 */
export class PSO<T extends Encoding> extends EvolutionaryAlgorithm<T> {
  protected static override LOGGER: Logger;
  private W = 0.5;
  private c1 = 0.25;
  private c2 = 0.25;
  private pBestMap: Map<string, T>; // Map containing best current solution for each particle
  private velocityMap: Map<string, number[]>; // Map containing velocity vectors for each particle

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);

    this.pBestMap = new Map<string, T>( // Initiate pBest to current value of each particle
      this._population.map((particle) => [particle.id, particle])
    );

    this.velocityMap = new Map<string, number[]>( // Initiate velocity matrix with zero values
      this._population.map((particle) => [
        particle.id,
        Array.from<number>({
          length: this._objectiveManager.getCurrentObjectives().size,
        }).fill(0),
      ])
    );

    PSO.LOGGER = getLogger("PSO");
  }

  protected _environmentalSelection(): void {
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
    PSO.LOGGER.debug(
      `Number of objectives = ${
        this._objectiveManager.getCurrentObjectives().size
      }`
    );

    const nextPopulation: T[] = [];
    const archive = this.getNonDominatedFront(
      this._objectiveManager.getCurrentObjectives(),
      this._population
    );

    // Iterate over population
    for (const particle of this._population) {
      const gBest = this._selectGbest(particle, archive);
      const pBest = this._selectPbest(particle);

      this._updateVelocity(particle, pBest, gBest);

      nextPopulation.push(this._updatePosition(particle));
    }

    this._population = nextPopulation;
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
    const minValue = Math.min(...velocity);
    const normalizedVelocity = velocity.map(
      (v) => (v - minValue) / (Math.max(...velocity) - minValue)
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
  protected _updateVelocity(particle: T, pBest: T, gBest: T): void {
    const r1 = Math.random();
    const r2 = Math.random();

    const objectivesList = [...this._objectiveManager.getCurrentObjectives()];

    // Update velocity according to PSO formula
    const newVelocity = this.velocityMap
      .get(particle.id)
      .map(
        (velocity, dimensionIndex) =>
          this.W * velocity +
          this.c1 *
            r1 *
            (pBest.getDistance(objectivesList[dimensionIndex]) -
              particle.getDistance(objectivesList[dimensionIndex])) +
          this.c2 *
            r2 *
            (gBest.getDistance(objectivesList[dimensionIndex]) -
              particle.getDistance(objectivesList[dimensionIndex]))
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

    const dominatingParticle = archive.filter(
      (archiveParticle) =>
        DominanceComparator.compare(
          archiveParticle,
          particle,
          this._objectiveManager.getCurrentObjectives()
        ) === 1
    );

    if (dominatingParticle.length === 0)
      throw new Error("The dominating particles list shouldn't be empty");

    return this._weightedProbabilitySelection(dominatingParticle);
  }

  /** Updates current particle local best if the new value
   *  dominates the old one
   *
   * @param particle Particle to be compared with local best
   * @returns Either particle passed as parameter or old local best
   */
  protected _selectPbest(particle: T): T {
    const flag = DominanceComparator.compare(
      particle,
      this.pBestMap.get(particle.id),
      this._objectiveManager.getCurrentObjectives()
    );

    if (flag === 1) {
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
          ) === 1
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
}
