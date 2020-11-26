import {GA} from './GA'
import { Individual } from '../gene/Individual'
import {Fitness} from "../objective/Fitness";
import {GeneOptionManager} from "../gene/GeneOptionManager";
import {Sampler} from "../sampling/Sampler";

const {fastNonDomSorting} = require('../operator/sorting/FastNonDomSorting')
const {crowdingDistance} = require('../operator/CrowdingDistance')
const {tournamentSelection} = require('../operator/selection/TournamentSelection')

/**
 * Fast Elist Non-dominated Sorting Genetic Algorithm (NSGA-II)
 *
 * @author Dimitri Stallenberg and Annibale Panichella
 */
export class NSGA2 extends GA {
    constructor(fitness: Fitness, geneOptions: GeneOptionManager, sampler: Sampler) {
        super(fitness, geneOptions, sampler);
    }

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
        // TODO crossover

        for (let index=0; index < this.popsize; index++) {
            let individual = tournamentSelection(population, 2)
            offspring.push(individual.mutate(this.sampler))
        }

        return offspring
    }

    getCurrentCoverage(): number {
        return 0; // TODO
    }
}
