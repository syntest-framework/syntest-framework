import {GeneticAlgorithm} from './GeneticAlgorithm'
import { Individual } from '../gene/Individual'
import {TreeCrossover} from "../operators/crossover/TreeCrossover";

const {fastNonDomSorting} = require('../operators/ranking/FastNonDomSorting')
const {crowdingDistance} = require('../operators/ranking/CrowdingDistance')
const {tournamentSelection} = require('../operators/selection/TournamentSelection')

/**
 * Fast Elist Non-dominated Sorting Genetic Algorithm (NSGA-II)
 *
 * @author Dimitri Stallenberg and Annibale Panichella
 */
export class NSGA2 extends GeneticAlgorithm {

    async generation (population: Individual[]) {
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
        let remain = this.popsize;
        let index = 0;

        // Obtain the next front
        let currentFront = F[index]

        while ((remain > 0) && (remain >= currentFront.length) && !currentFront.length) {
            // Assign crowding distance to individuals
            crowdingDistance(currentFront)

            // Add the individuals of this front
            for (let individual of currentFront) {
                if (newPopulation.length < this.popsize) {
                    newPopulation.push(individual)
                }
            }

            // Decrement remain
            remain = remain - currentFront.length

            // Obtain the next front
            index++;
            if (remain > 0) {
                currentFront = F[index]
            }
        }

        // Remain is less than front(index).size, insert only the best one
        if (remain > 0 && currentFront.length>0) { // front contains individuals to insert
            crowdingDistance(currentFront)

            currentFront.sort(function(a: Individual, b: Individual) { // sort in descending order of crowding distance
                return b.getCrowdingDistance() - a.getCrowdingDistance()
            })
            let counter = 0
            for (let individual of currentFront) {
                if (counter > remain)
                    break

                newPopulation.push(individual)
                counter++
            }
        }

        return newPopulation
    }

    /**
     * Generate a population of offspring.
     * @param population the population to generate offspring from
     * @returns {[]} the offspring population
     */
    generateOffspring(population: Individual[]) {
        let offspring = []

        for (let index=0; index < this.popsize; index++) {
            let parentA = tournamentSelection(population, 2)
            let parentB = tournamentSelection(population, 2)
            let [childA, childB] = TreeCrossover(parentA, parentB)

            offspring.push(childA.mutate(this.sampler))
            offspring.push(childB.mutate(this.sampler))
        }

        return offspring
    }

    getCurrentCoverage(): number {
        return 0; // TODO
    }
}
