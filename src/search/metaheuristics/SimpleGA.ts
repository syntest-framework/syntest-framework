import { GeneticAlgorithm } from "./GeneticAlgorithm";
import {Fitness, Target, TestCase, TestCaseSampler} from "../..";

/**
 * Simple Genetic Algorithm
 *
 * @author Dimitri Stallenberg
 */
export class SimpleGA extends GeneticAlgorithm {

  constructor(target: Target,
              fitness: Fitness,
              sampler: TestCaseSampler
              ) {
    super(target, fitness, sampler);
  }

  async generation(population: TestCase[]) {
    // create offspring population
    const offspring = this.generateOffspring(population);

    // evaluate
    await this.fitness.evaluateMany(offspring, this.objectives);

    // add the offspring to the population
    population.push(...offspring);

    // non-dominated sorting
    const F = this.sorting.sort(population);

    // select new population
    const newPopulation = [];
    for (const front of F) {
      for (const individual of front) {
        if (newPopulation.length < this.popsize) {
          newPopulation.push(individual);
        }
      }
    }

    return newPopulation;
  }

  /**
   * Generate a population of offspring.
   * @param population the population to generate offspring from
   * @returns {[]} the offspring population
   */
  generateOffspring(population: TestCase[]) {
    const offspring = [];

    for (let index = 0; index < this.popsize / 2; index++) {
      const [parentA] = this.crossoverSelection.select(population, 1);
      const [parentB] = this.crossoverSelection.select(population, 1);
      const children = this.crossover.crossover([parentA, parentB]);

      for (let child of children) {
        offspring.push(child.mutate(this.sampler));
      }
    }

    return offspring;
  }

  getCurrentCoverage(): number {
    return 0; // TODO
  }
}
