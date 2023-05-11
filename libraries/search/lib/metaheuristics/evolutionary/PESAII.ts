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
        this.archive = this.archive.filter(
          (archivedSolution) => !this.isDominated(archivedSolution, solution)
        );
        this.addSolutionToArchive(solution);
      }
    }

    const parents = [];
    for (let index = 0; index < size; index++) {
      const parent = this.selectParent();
      parents.push(parent);
    }

    this._population = parents;
  }
  private archive: T[];
  private archiveSize: number;
  private gridSize: number;
  private grid: Map<string, T[]>;

  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number,
    archiveSize: number,
    gridSizeInput: number
  ) {
    super(objectiveManager, encodingSampler, procreation, populationSize);
    this.archive = [];
    this.gridSize = gridSizeInput;
    this.grid = new Map();
    this.archiveSize = archiveSize;
  }

  private getGridLocation(solution: T): number[] {
    return [...this._objectiveManager.getUncoveredObjectives()].map(
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

  private selectParent(): T {
    // Calculate the total density of all boxes
    const totalDensity = [...this.grid.values()].reduce(
      (sum, solutions) => sum + solutions.length,
      0
    );

    // Calculate the selection probabilities for each box
    const boxProbabilities = [...this.grid.entries()].map(
      ([key, solutions]) => ({
        key,
        probability: solutions.length / totalDensity,
      })
    );

    // Sort the boxes by their probabilities
    boxProbabilities.sort((a, b) => a.probability - b.probability);

    // Roulette wheel selection
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    let selectedBoxKey: string;

    for (const box of boxProbabilities) {
      cumulativeProbability += box.probability;
      if (randomValue <= cumulativeProbability) {
        selectedBoxKey = box.key;
        break;
      }
    }

    // Select a random solution from the selected box
    const selectedBox = this.grid.get(selectedBoxKey);
    return selectedBox[Math.floor(Math.random() * selectedBox.length)];
  }

  private addSolutionToArchive(solution: T): void {
    this.archive.push(solution);
    this.addToGrid(solution);

    if (this.archive.length > this.archiveSize) {
      const maxDensity = Math.max(
        ...[...this.grid.values()].map((solutions) => solutions.length)
      );
      const candidates = [...this.grid.entries()].filter(
        ([, solutions]) => solutions.length === maxDensity
      );
      const selectedEntry =
        candidates[Math.floor(Math.random() * candidates.length)];
      const removedSolution = selectedEntry[1].shift()!;
      const index = this.archive.indexOf(removedSolution);
      this.archive.splice(index, 1);
      if (selectedEntry[1].length === 0) {
        this.grid.delete(selectedEntry[0]);
      }
    }
  }

  private isDominated(a: T, b: T): boolean {
    let returnValue = false;
    if (
      DominanceComparator.compare(
        a,
        b,
        this._objectiveManager.getUncoveredObjectives()
      ) === -1
    )
      returnValue = true;

    return returnValue;
  }
}
