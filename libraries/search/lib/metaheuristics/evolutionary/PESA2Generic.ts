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
// PESA-2 implementation in TypeScript

type ObjectiveFunction = (solution: number[]) => number;
type GenerateSolution = () => number[];
type IsDominated = (a: number[], b: number[]) => boolean;

export class PESA2 {
  private archive: number[][];
  private gridSize: number;
  private grid: Map<string, number[][]>;

  constructor(
    private objectiveFunctions: ObjectiveFunction[],
    private generateSolution: GenerateSolution,
    private isDominated: IsDominated,
    private populationSize: number,
    private archiveSize: number,
    gridSizeInput: number,
    private iterations: number
  ) {
    this.archive = [];
    this.gridSize = gridSizeInput;
    this.grid = new Map();
  }

  private getGridLocation(solution: number[]): number[] {
    return this.objectiveFunctions.map((f) => {
      const minValue = Math.min(...this.archive.map((element) => f(element)));
      const maxValue = Math.max(...this.archive.map((element) => f(element)));
      return Math.floor(
        ((f(solution) - minValue) / (maxValue - minValue)) * this.gridSize
      );
    });
  }

  private addToGrid(solution: number[]): void {
    const gridLocation = this.getGridLocation(solution).toString();
    if (!this.grid.has(gridLocation)) {
      this.grid.set(gridLocation, []);
    }
    this.grid.get(gridLocation)?.push(solution);
  }
  private selectParent(): number[] {
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

  private static crossover(parent1: number[], parent2: number[]): number[] {
    const alpha = Math.random();
    return parent1.map(
      (value, index) => alpha * value + (1 - alpha) * parent2[index]
    );
  }

  private static mutate(solution: number[]): number[] {
    const mutationRate = 1 / solution.length;
    return solution.map((value) =>
      Math.random() < mutationRate ? Math.random() : value
    );
  }

  private addSolutionToArchive(solution: number[]): void {
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

  public run(): number[][] {
    // Initialize population
    for (let index = 0; index < this.populationSize; index++) {
      const solution = this.generateSolution();
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
    for (let index = 0; index < this.iterations; index++) {
      const parent1 = this.selectParent();
      const parent2 = this.selectParent();
      let offspring = PESA2.crossover(parent1, parent2);
      offspring = PESA2.mutate(offspring);

      if (
        !this.archive.some((archivedSolution) =>
          this.isDominated(offspring, archivedSolution)
        )
      ) {
        this.archive = this.archive.filter(
          (archivedSolution) => !this.isDominated(archivedSolution, offspring)
        );
        this.addSolutionToArchive(offspring);
      }
    }
    return this.archive;
  }
}
