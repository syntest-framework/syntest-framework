import {NSGA2} from './NSGA2'
import { Individual } from '../gene/Individual'
import {Fitness} from "../objective/Fitness";
import {GeneOptionManager} from "../gene/GeneOptionManager";
import {Sampler} from "../sampling/Sampler";
import {logger, Objective} from "../..";

const {crowdingDistance} = require('../operator/CrowdingDistance')
const {compare} = require('../operator/DominanceComparator')

/**
 * Many-objective Sorting Algorithm (MOSA)
 *
 * @author Annibale Panichella
 */
export class MOSA extends NSGA2 {

    private coveredObjectives: Set<number>
    private uncoveredObjectives: Set<number>

    constructor(fitness: Fitness, geneOptions: GeneOptionManager, sampler: Sampler) {
        super(fitness, geneOptions, sampler);
        this.coveredObjectives = new Set<number>()
        this.uncoveredObjectives = new Set<number>()

        for (let i=0; i<this.objectives.length; i++){
            this.uncoveredObjectives.add(i)
        }
    }

    async generation (population: Individual[]) {
        logger.info("MOSA HERE")
        // create offspring population
        let offspring = this.generateOffspring(population)

        // evaluate
        await this.fitness.evaluateMany(offspring, this.objectives)
        this.updateCoveredGoals(offspring)

        // add the offspring to the population
        population.push(...offspring)

        // non-dominated sorting
        logger.debug("Number of objectives = "+ this.uncoveredObjectives.size)
        let F = this.preferenceSortingAlgorithm(population, this.uncoveredObjectives)

        // select new population
        let newPopulation = []
        let remain = this.popsize;
        let index = 0;

        // Obtain the next front
        let currentFront: Individual[] = F[index];

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
                // @ts-ignore
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

    /*
     See: Preference sorting as discussed in the TSE paper for DynaMOSA
   */
    protected preferenceSortingAlgorithm(population: Individual[], objectives: Set<number>): Individual[][]{
        let fronts: Individual[][] = [[]]

        if (objectives == null){
            logger.debug("It looks like a bug in MOSA: the set of objectives cannot be null")
            return fronts
        }

        if (objectives.size == 0) {
            logger.debug("Trivial case: no objectives for the sorting")
            return fronts
        }

        // compute the first front using the Preference Criteria
        let frontZero = this.preferenceCriterion(population, objectives)

        frontZero.forEach(function (value) {
            fronts[0].push(value)
            value.setRank(0)
        })
        logger.debug("First front size :" + frontZero.length)
        logger.debug("Pop size :" + this.popsize)
        logger.debug("Pop + Off size :" + population.length)

        // compute the remaining non-dominated Fronts
        let remainingSolutions: Individual[] = []
        remainingSolutions = remainingSolutions.filter(obj => frontZero.includes(obj))

        let selectedSolutions = frontZero.length
        let frontIndex = 1

        while (selectedSolutions < this.popsize && remainingSolutions.length != 0){
            let front = this.getNonDominatedFront(objectives, remainingSolutions)
            for (let solution of front){
                fronts[frontIndex].push(solution)
                solution.setRank(frontIndex)
            }

            remainingSolutions = remainingSolutions.filter(x => {
                return front.includes(x);
            })
            selectedSolutions += front.length

            frontIndex += 1
        }

        logger.debug("Number of fronts :" + fronts.length)
        logger.debug("Front zero size :" + fronts[0].length)
        //logger.debug("Front one size :" + fronts[1].length)
        logger.debug("# selected solutions :" +selectedSolutions)
        logger.debug("Pop size :" +this.popsize)
        return fronts
    }

    /**
     * It retrieves the front of non-dominated solutions from a list
     */
    protected getNonDominatedFront(notCovered: Set<number>, remainingSolutions: Individual[]): Individual[]{
        let front: Individual[] = []
        let isDominated: Boolean

        for (let current of remainingSolutions) {
            isDominated = false
            let dominatedSolutions: Individual[] = []
            for (let best of front) {
                let flag = compare(current, best, notCovered)
                if (flag == -1) {
                    dominatedSolutions.push(best)
                }
                if (flag == +1) {
                    isDominated = true
                }
            }

            if (isDominated)
                continue

            front = front.filter(x => {
                return dominatedSolutions.includes(x);
            })

            front.push(current)
        }
        return front
    }

    protected preferenceCriterion(population: Individual[], objectives: Set<number>): Individual[]{
        let frontZero: Individual[] = []
        objectives.forEach(function(index){
            let chosen = population[0]
            for (let individual of population){
                if (individual.getEvaluation().fitness[index] < chosen.getEvaluation().fitness[index])
                    // if lower fitness, than it is better
                    chosen = individual
                else if (individual.getEvaluation().fitness[index] == chosen.getEvaluation().fitness[index]){
                    // at the same level of fitness, we look at test case size
                    if ((individual.root.getChildren().length < chosen.root.getChildren().length &&
                        individual.root.getChildren().length > 1) ||
                        (individual.root.getChildren().length == chosen.root.getChildren().length &&
                            Math.random()<0.50)) {
                        // Secondary criterion based on tests lengths
                        chosen = individual
                    }
                }
            }

            // MOSA preference criterion: the best for a target gets Rank 0
            chosen.setRank(0)
            if (!frontZero.includes(chosen))
                frontZero.push(chosen)
        })
        return frontZero
    }

    protected updateCoveredGoals(offspring: Individual[]){
        let covered: number[] = []
        this.uncoveredObjectives.forEach(function(index) {
            for(let test of offspring){
                if (test.getEvaluation().fitness[index] == 0.0 && !covered.includes(index)){
                    covered.push(index)
                }
            }
        })
        for (let index of covered){
            this.uncoveredObjectives.delete(index)
            this.coveredObjectives.add(index)
        }
    }
}
