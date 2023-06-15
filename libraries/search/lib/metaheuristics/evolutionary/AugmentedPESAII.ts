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
import { Encoding } from "../../Encoding";
import { EncodingSampler } from "../../EncodingSampler";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { Procreation } from "../../operators/procreation/Procreation";
import { shouldNeverHappen } from "../../util/diagnostics";

import { EvolutionaryAlgorithm } from "./EvolutionaryAlgorithm";
import { MOSAFamily } from "./MOSAFamily";

export class PESA2<T extends Encoding> extends EvolutionaryAlgorithm<T> {
  protected override _environmentalSelection(size: number): void {
    this.archive = [];
    this.grid = new Map();
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

    const mosa = new MOSAFamily(
      this._objectiveManager,
      this._encodingSampler,
      this._procreation,
      this._populationSize
    );

    const F = mosa.preferenceSortingAlgorithm(
      this._population,
      this._objectiveManager.getCurrentObjectives()
    );

    const nextPopulation = [];
    let remain = Math.max(size, F[0].length);
    let index = 0;

    // Obtain the next front
    let currentFront: T[] = F[index];

    while (remain > 0 && remain >= currentFront.length) {
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
      for (const solution of currentFront) {
        this.addSolution(solution);
      }

      // Calculate the total density of all boxes
      const totalDensity = [...this.grid.values()].reduce(
        (sum, solutions) => sum + solutions.length,
        0
      );

      // Calculate the densities for each box
      const boxDensities = [...this.grid.entries()].map(([key, solutions]) => ({
        key,
        density: solutions.length / totalDensity,
      }));

      // Sort the boxes by their densities (ascending order)
      boxDensities.sort((a, b) => a.density - b.density);

      for (const box of boxDensities) {
        if (remain == 0) break;

        const selectedBox = this.grid.get(box.key);
        const selectedSolution =
          selectedBox[Math.floor(Math.random() * selectedBox.length)];
        nextPopulation.push(selectedSolution);
        remain--;
      }
    }

    this._population = nextPopulation;
  }
  private archive: T[];
  private gridSize: number;
  private grid: Map<string, T[]>;

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number,
    gridSizeInput: number
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);
    this.archive = [];
    this.gridSize = gridSizeInput;
    this.grid = new Map();
  }

  private getGridLocation(solution: T): number[] {
    return [...this._objectiveManager.getCurrentObjectives()].map(
      (objective) => {
        const minValue = Math.min(
          ...this.archive.map((x) => objective.calculateDistance(x))
        );
        const maxValue = Math.max(
          ...this.archive.map((x) => objective.calculateDistance(x))
        );
        const objectiveValue = objective.calculateDistance(solution);
        return Math.floor(
          ((objectiveValue - minValue) / (maxValue - minValue)) * this.gridSize
        );
      }
    );
  }

  private addToGrid(solution: T): void {
    const gridLocation = this.getGridLocation(solution).toString();
    if (!this.grid.has(gridLocation)) {
      this.grid.set(gridLocation, []);
    }
    this.grid.get(gridLocation)?.push(solution);
  }

  private addSolution(solution: T): void {
    this.archive.push(solution);
    this.addToGrid(solution);
  }
}
