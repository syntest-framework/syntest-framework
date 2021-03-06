import {GeneticAlgorithm} from './GeneticAlgorithm'
import {fastNonDomSorting, TestCase} from "../..";

/**
 * Simple Genetic Algorithm BaseClass
 *
 * @author Dimitri Stallenberg
 */
export class SimpleGA extends GeneticAlgorithm {
    async generation(population: TestCase[]) {
        // create offspring population
        let offspring = this.generateOffspring(population)

        // evaluate
        await this.fitness.evaluateMany(offspring, this.objectives)

        // add the offspring to the population
        population.push(...offspring)

        // non-dominated sorting
        let F = fastNonDomSorting(population)

        // select new population
        let newPopulation = []
        for (let front of F) {
            for (let individual of front) {
                if (newPopulation.length < this.popsize) {
                    newPopulation.push(individual)
                }
            }
        }

        return newPopulation
    }

    /**
     * Generate a population of offspring.
     * @param population the population to generate offspring from
     * @returns {[]} the offspring population
     */
    generateOffspring(population: TestCase[]) {
        let offspring = []
        // TODO crossover

        for (let individual of population) {
            offspring.push(individual.mutate(this.sampler))
        }

        return offspring
    }

    getCurrentCoverage(): number {
        return 0; // TODO
    }
}
