import {NSGA2} from './NSGA2'
import { Individual } from '../gene/Individual'
import {Fitness} from "../objective/Fitness";
import {GeneOptionManager} from "../gene/GeneOptionManager";
import {Sampler} from "../sampling/Sampler";
import {logger, Objective} from "../..";
import {DominanceComparator} from "../operator/DominanceComparator";

const {crowdingDistance} = require('../operator/CrowdingDistance')
const {compare} = require('../operator/DominanceComparator')

/**
 * Many-objective Sorting Algorithm (MOSA)
 *
 * @author Annibale Panichella
 */
export class MOSA extends NSGA2 {
    private uncoveredObjectives: Objective[]

    private archive2: Map<Objective, Individual>

    constructor(fitness: Fitness, geneOptions: GeneOptionManager, sampler: Sampler) {
        super(fitness, geneOptions, sampler);
        this.uncoveredObjectives = []

        this.objectives.forEach((objective) => {
            this.uncoveredObjectives.push(objective)
        })

        // let's initialize the archive
        this.archive2 = new Map<Objective, Individual>()
    }

    async generation (population: Individual[]) {
        logger.debug("MOSA generation")
        if (!this.uncoveredObjectives.length) {
            logger.debug("No more objectives left all objectives are covered")
            return population
        }

        // create offspring population
        let offspring = this.generateOffspring(population)

        // evaluate
        await this.calculateFitness(offspring)

        if (!this.uncoveredObjectives.length) {
            logger.debug("No more objectives left all objectives are covered")
            return population
        }

        // add the offspring to the population
        population.push(...offspring)

        // non-dominated sorting
        logger.debug("Number of objectives = "+ this.uncoveredObjectives.length)
        let F = this.preferenceSortingAlgorithm(population, this.uncoveredObjectives)
        console.log(F)

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

        if (newPopulation.length !== this.popsize) {
            throw new Error(`Population sizes do not match ${newPopulation.length} != ${this.popsize}`)
        }
        return newPopulation
    }

    async calculateFitness (offspring: Individual[]) {
        let uObj : Objective[] = []
        for (let obj of this.uncoveredObjectives){
            uObj.push(obj)
        }
        await this.fitness.evaluateMany(offspring, uObj)

        let covered: Objective[] = []
        for(let objective of this.uncoveredObjectives){
            for(let test of offspring){
                if (test.getEvaluation().get(objective) == 0.0 && !covered.includes(objective)){
                    covered.push(objective)
                    if (! this.archive2.has(objective)){
                        this.archive2.set(objective, test)
                    }
                }
            }
        }
        for (let index of covered){
            let element = this.uncoveredObjectives.indexOf(index)
            this.uncoveredObjectives.splice(element, 1)
        }
    }

    /*
     See: Preference sorting as discussed in the TSE paper for DynaMOSA
   */
    public preferenceSortingAlgorithm(population: Individual[], objectives: Objective[]): Individual[][]{
        let fronts: Individual[][] = [[]]

        if (objectives === null){
            logger.debug("It looks like a bug in MOSA: the set of objectives cannot be null")
            return fronts
        }

        if (objectives.length === 0) {
            logger.debug("Trivial case: no objectives for the sorting")
            return fronts
        }

        // compute the first front using the Preference Criteria
        let frontZero = this.preferenceCriterion(population, objectives)

        for (let individual of frontZero){
            fronts[0].push(individual)
            individual.setRank(0)
        }

        logger.debug("First front size :" + frontZero.length)
        logger.debug("Pop size :" + this.popsize)
        logger.debug("Pop + Off size :" + population.length)

        // compute the remaining non-dominated Fronts
        let remainingSolutions: Individual[] = population
        for (let selected of frontZero){
            let index = remainingSolutions.indexOf(selected)
            remainingSolutions.splice(index, 1)
        }

        let selectedSolutions = frontZero.length
        let frontIndex = 1

        while (selectedSolutions < this.popsize && remainingSolutions.length != 0){
            let front: Individual[] = this.getNonDominatedFront(objectives, remainingSolutions)
            fronts[frontIndex] = front
            for (let solution of front){
                solution.setRank(frontIndex)
            }

            for (let selected of front){
                let index = remainingSolutions.indexOf(selected)
                remainingSolutions.splice(index, 1)
            }

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
    public getNonDominatedFront(notCovered: Objective[], remainingSolutions: Individual[]): Individual[]{
        const targets = new Set<Objective>(notCovered)

        let front: Individual[] = []
        let isDominated: Boolean

        for (let current of remainingSolutions) {
            isDominated = false
            let dominatedSolutions: Individual[] = []
            for (let best of front) {
                let flag = DominanceComparator.compare(current, best, targets)
                if (flag == -1) {
                    dominatedSolutions.push(best)
                }
                if (flag == +1) {
                    isDominated = true
                }
            }

            if (isDominated)
                continue

            for (let dominated of dominatedSolutions){
                let index = front.indexOf(dominated)
                front.splice(index, 1)
            }

            front.push(current)
        }
        return front
    }

    /** Preference criterion in MOSA: for each objective, we select the test case closer to cover it
     * @param population
     * @param objectives list of objective to consider
     * @protected
     */
    public preferenceCriterion(population: Individual[], objectives: Objective[]): Individual[]{
        let frontZero: Individual[] = []
        for (let objective of objectives){
            let chosen = population[0]

            for (let index = 1; index<population.length ; index++){
                if (population[index].getEvaluation().get(objective) < chosen.getEvaluation().get(objective))
                    // if lower fitness, than it is better
                    chosen = population[index]
                else if (population[index].getEvaluation().get(objective) == chosen.getEvaluation().get(objective)){
                    // at the same level of fitness, we look at test case size
                    if ((population[index].root.getChildren().length < chosen.root.getChildren().length &&
                        population[index].root.getChildren().length > 1) ||
                        (population[index].root.getChildren().length == chosen.root.getChildren().length &&
                            Math.random()<0.50)) {
                        // Secondary criterion based on tests lengths
                        chosen = population[index]
                    }
                }
            }

            // MOSA preference criterion: the best for a target gets Rank 0
            chosen.setRank(0)
            if (!frontZero.includes(chosen))
                frontZero.push(chosen)
        }
        return frontZero
    }

    protected getFinalTestSuite(): Individual[]{
        let suite: Individual[] = []
        for (let ind of this.archive2.values()){
            if (! suite.includes(ind))
                suite.push(ind)
        }
        return suite
    }
}
