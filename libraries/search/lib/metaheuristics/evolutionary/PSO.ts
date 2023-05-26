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
  private maxEpochs = 2000;

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number,
    maxEpochs: number
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);
    this.maxEpochs = maxEpochs;
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

    let epoch = 0;
    let archive = [];
    const pBestArray = this._population; // Array containing pBest solutions

    // Velocity matrix
    const V: number[][] = Array.from(
      // Initialize all velocities to 0.
      { length: this._population.length },
      () =>
        Array.from<number>({
          length: this._objectiveManager.getCurrentObjectives().size,
        }).fill(0)
    );

    while (epoch < this.maxEpochs) {
      archive = this.getNonDominatedFront(
        this._objectiveManager.getUncoveredObjectives(),
        this._population
      );

      for (const [index, particle] of this._population.entries()) {
        const gBest = this._selectGbest(particle, archive);
        const pBest = this._selectPbest(particle, pBestArray, index);

        V[index] = this._updateVelocity(particle, V[index], pBest, gBest);

        //TODO: Apply crossover and mutation based on velocity
      }

      epoch++;
    }
  }

  protected _updateVelocity(
    particle: T,
    velocity: number[],
    pBest: T,
    gBest: T
  ): number[] {
    const r1 = Math.random();
    const r2 = Math.random();

    const objectivesList = [...this._objectiveManager.getCurrentObjectives()];

    // Update velocity according to PSO formula
    return velocity.map(
      (v, dimensionIndex) =>
        this.W * v +
        this.c1 *
          r1 *
          (pBest.getDistance(objectivesList[dimensionIndex]) -
            particle.getDistance(objectivesList[dimensionIndex])) +
        this.c2 *
          r2 *
          (gBest.getDistance(objectivesList[dimensionIndex]) -
            particle.getDistance(objectivesList[dimensionIndex]))
    );
  }

  protected _selectGbest(particle: T, archive: T[]): T {
    if (archive.includes(particle))
      return this._weightedProbabilitySelection(archive);

    const dominatingParticle = archive.filter(
      (archiveParticle) =>
        DominanceComparator.compare(
          archiveParticle,
          particle,
          this._objectiveManager.getCoveredObjectives()
        ) === 1
    );

    if (dominatingParticle.length === 0)
      throw new Error("The dominating particles list shouldn't be empty");

    return this._weightedProbabilitySelection(dominatingParticle);
  }

  protected _selectPbest(particle: T, pBestArray: T[], index: number): T {
    const flag = DominanceComparator.compare(
      particle,
      pBestArray[index],
      this._objectiveManager.getCurrentObjectives()
    );

    if (flag === 1) {
      pBestArray[index] = particle;
      return particle;
    }

    return pBestArray[index];
  }

  protected _weightedProbabilitySelection(archive: T[]): T {
    //Creates an array of objects containing the current particle from the archive and the number of particles dominated by it.
    const customArchive = archive.map((archiveParticle) => ({
      particle: archiveParticle,
      dominatedParticles: this._population.filter(
        (particle) =>
          DominanceComparator.compare(
            archiveParticle,
            particle,
            this._objectiveManager.getCoveredObjectives()
          ) === 1
      ).length,
    }));

    const weightsSum = customArchive.reduce(
      (accumulator, { dominatedParticles }) =>
        accumulator + 1 / dominatedParticles,
      0
    );

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
