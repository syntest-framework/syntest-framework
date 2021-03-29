import { GeneticAlgorithm } from "./GeneticAlgorithm";
import { TestCase } from "../../testcase/TestCase";
import {Target} from "../objective/Target";
import {Fitness} from "../objective/Fitness";
import {TestCaseSampler} from "../../testcase/sampling/TestCaseSampler";


/**
 * Fast Elist Non-dominated Sorting Genetic Algorithm (NSGA-II)
 *
 * @author Dimitri Stallenberg and Annibale Panichella
 */
export class NSGA2 extends GeneticAlgorithm {
  constructor(target: Target,
              fitness: Fitness,
              sampler: TestCaseSampler) {
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
    let remain = this.popsize;
    let index = 0;

    // Obtain the next front
    let currentFront = F[index];

    while (
      remain > 0 &&
      remain >= currentFront.length &&
      !currentFront.length
    ) {
      // Assign crowding distance to individuals
      this.ranking.rank(currentFront);

      // Add the individuals of this front
      for (const individual of currentFront) {
        if (newPopulation.length < this.popsize) {
          newPopulation.push(individual);
        }
      }

      // Decrement remain
      remain = remain - currentFront.length;

      // Obtain the next front
      index++;
      if (remain > 0) {
        currentFront = F[index];
      }
    }

    // Remain is less than front(index).size, insert only the best one
    if (remain > 0 && currentFront.length > 0) {
      // front contains individuals to insert
      this.ranking.rank(currentFront);

      currentFront.sort(function (a: TestCase, b: TestCase) {
        // sort in descending order of crowding distance
        return b.getCrowdingDistance() - a.getCrowdingDistance();
      });
      let counter = 0;
      for (const individual of currentFront) {
        if (counter > remain) break;

        newPopulation.push(individual);
        counter++;
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
    if (this.objectives.length == 0) return 100;

    return (this.archive.size / this.objectives.length) * 100;
  }
}
