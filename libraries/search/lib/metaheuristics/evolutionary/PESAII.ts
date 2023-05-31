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
import { Procreation } from "../../operators/procreation/Procreation";
import { shouldNeverHappen } from "../../util/diagnostics";

import { EvolutionaryAlgorithm } from "./EvolutionaryAlgorithm";

export class PESA2<T extends Encoding> extends EvolutionaryAlgorithm<T> {
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

    for (let index = 0; index < this._populationSize; index++) {
      const solution = this._population[index];
      if (
        !this.archive.some((archivedSolution) =>
          this.isDominated(solution, archivedSolution)
        )
      ) {
        for (const archivedSolution of this.archive) {
          const isDominated = this.isDominated(archivedSolution, solution);
          if (isDominated) {
            this.removeSolution(archivedSolution);
          }
        }
        this.addSolution(solution);
      }
    }

    // Calculate the total density of all boxes
    const totalDensity = [...this.grid.values()].reduce(
      (sum, solutions) => sum + solutions.length,
      0
    );

    // Calculate the selection probabilities for each box
    const boxDensities = [...this.grid.entries()].map(([key, solutions]) => ({
      key,
      density: solutions.length / totalDensity,
    }));

    // Sort the boxes by their probabilities
    boxDensities.sort((a, b) => a.density - b.density);

    const newPopulation = [];
    for (let index = 0; index < size; index++) {
      const boxKey = boxDensities[index].key;
      const selectedBox = this.grid.get(boxKey);
      const selectedSolution =
        selectedBox[Math.floor(Math.random() * selectedBox.length)];
      newPopulation.push(selectedSolution);
    }

    this._population = newPopulation;
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

  private removeSolution(solution: T): void {
    // Remove from archive
    const index = this.archive.indexOf(solution);
    if (index > -1) {
      this.archive.splice(index, 1);
    }

    // Remove from grid
    const gridLocation = this.getGridLocation(solution).toString();
    const gridEntry = this.grid.get(gridLocation);
    if (gridEntry) {
      const gridIndex = gridEntry.indexOf(solution);
      if (gridIndex > -1) {
        gridEntry.splice(gridIndex, 1);
      }
      if (gridEntry.length === 0) {
        this.grid.delete(gridLocation);
      } else {
        this.grid.set(gridLocation, gridEntry);
      }
    }
  }

  private isDominated(a: T, b: T): boolean {
    let returnValue = false;
    if (
      DominanceComparator.compare(
        a,
        b,
        this._objectiveManager.getCurrentObjectives()
      ) === -1
    )
      returnValue = true;

    return returnValue;
  }
}
