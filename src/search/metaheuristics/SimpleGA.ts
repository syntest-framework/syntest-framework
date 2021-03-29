import { GeneticAlgorithm } from "./GeneticAlgorithm";
import { fastNonDomSorting, TestCase } from "../..";

/**
 * Simple Genetic Algorithm BaseClass
 *
 * @author Dimitri Stallenberg
 */
export class SimpleGA extends GeneticAlgorithm {
  async generation(population: TestCase[]) {
    // create offspring population
    const offspring = this.generateOffspring(population);

    // evaluate
    await this.fitness.evaluateMany(offspring, this.objectives);

    // add the offspring to the population
    population.push(...offspring);

    // non-dominated sorting
    const F = fastNonDomSorting(population);

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
    // TODO crossover

    for (const individual of population) {
      offspring.push(individual.mutate(this.sampler));
    }

    return offspring;
  }

  getCurrentCoverage(): number {
    return 0; // TODO
  }
}
