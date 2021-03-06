import {NSGA2} from './NSGA2'
import { TestCase } from '../..'
import {Fitness} from "../..";
import {Sampler} from "../..";
import {getLogger, Objective, Target} from "../..";
import {DominanceComparator} from "../comparators/DominanceComparator";

const {crowdingDistance} = require('../operators/ranking/CrowdingDistance')
const {compare} = require('../comparators/DominanceComparator')

/**
 * Many-objective Sorting Algorithm (MOSA)
 *
 * @author Annibale Panichella
 */
export class MOSA extends NSGA2 {
    private uncoveredObjectives: Objective[]

    constructor(target: Target, fitness: Fitness, sampler: Sampler) {
        super(target, fitness, sampler);
        this.uncoveredObjectives = []

        this.objectives.forEach((objective) => {
            this.uncoveredObjectives.push(objective)
        })
    }

    async generation (population: TestCase[]) {
        getLogger().debug("MOSA generation")
        if (!this.uncoveredObjectives.length) {
            getLogger().debug("No more objectives left all objectives are covered")
            return population
        }

        // create offspring population
        let offspring = this.generateOffspring(population)

        // evaluate
        await this.calculateFitness(offspring)

        if (!this.uncoveredObjectives.length) {
            getLogger().debug("No more objectives left all objectives are covered")
            return population
        }

        // add the offspring to the population
        population.push(...offspring)


        return this.environmentalSelection(population, this.popsize)
    }

    public environmentalSelection(pool: TestCase[], size: number): TestCase[]{
        // non-dominated sorting
        getLogger().debug("Number of objectives = "+ this.uncoveredObjectives.length)
        let F = this.preferenceSortingAlgorithm(pool, this.uncoveredObjectives)

        // select new population
        let newPopulation = []
        let remain = size;
        let index = 0;

        getLogger().debug("First front size = "+ F[0].length)

        // Obtain the next front
        let currentFront: TestCase[] = F[index];

        while ((remain > 0) && (remain >= currentFront.length)) {
            // Assign crowding distance to individuals
            crowdingDistance(currentFront)

            // Add the individuals of this front
            newPopulation.push(...currentFront);

            // Decrement remain
            remain = remain - currentFront.length

            // Obtain the next front
            index++;

            currentFront = F[index]
        }

        // Remain is less than front(index).size, insert only the best one
        if (remain > 0 && currentFront.length>0) { // front contains individuals to insert
            crowdingDistance(currentFront)

            currentFront = currentFront.sort(function(a: TestCase, b: TestCase) { // sort in descending order of crowding distance
                return b.getCrowdingDistance() - a.getCrowdingDistance()
            })

            for (let individual of currentFront) {
                if (remain == 0)
                    break

                newPopulation.push(individual)
                remain--
            }
        }

        if (newPopulation.length !== size) {
            throw new Error(`Population sizes do not match ${newPopulation.length} != ${size}`)
        }
        return newPopulation
    }

    async calculateFitness (offspring: TestCase[]) {
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
                    if (! this.archive.has(objective)){
                        this.archive.set(objective, test)
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
    public preferenceSortingAlgorithm(population: TestCase[], objectives: Objective[]): TestCase[][]{
        let fronts: TestCase[][] = [[]]

        if (objectives === null){
            getLogger().debug("It looks like a bug in MOSA: the set of objectives cannot be null")
            return fronts
        }

        if (objectives.length === 0) {
            getLogger().debug("Trivial case: no objectives for the sorting")
            return fronts
        }

        // compute the first front using the Preference Criteria
        let frontZero = this.preferenceCriterion(population, objectives)

        for (let individual of frontZero){
            fronts[0].push(individual)
            individual.setRank(0)
        }

        getLogger().debug("First front size :" + frontZero.length)
        getLogger().debug("Pop size :" + this.popsize)
        getLogger().debug("Pop + Off size :" + population.length)

        // compute the remaining non-dominated Fronts
        let remainingSolutions: TestCase[] = population
        for (let selected of frontZero){
            let index = remainingSolutions.indexOf(selected)
            remainingSolutions.splice(index, 1)
        }

        let selectedSolutions = frontZero.length
        let frontIndex = 1

        while (selectedSolutions < this.popsize && remainingSolutions.length != 0){
            let front: TestCase[] = this.getNonDominatedFront(objectives, remainingSolutions)
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

        getLogger().debug("Number of fronts :" + fronts.length)
        getLogger().debug("Front zero size :" + fronts[0].length)
        //getLogger().debug("Front one size :" + fronts[1].length)
        getLogger().debug("# selected solutions :" +selectedSolutions)
        getLogger().debug("Pop size :" +this.popsize)
        return fronts
    }

    /**
     * It retrieves the front of non-dominated solutions from a list
     */
    public getNonDominatedFront(notCovered: Objective[], remainingSolutions: TestCase[]): TestCase[]{
        const targets = new Set<Objective>(notCovered)

        let front: TestCase[] = []
        let isDominated: Boolean

        for (let current of remainingSolutions) {
            isDominated = false
            let dominatedSolutions: TestCase[] = []
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
    public preferenceCriterion(population: TestCase[], objectives: Objective[]): TestCase[]{
        let frontZero: TestCase[] = []
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
}
