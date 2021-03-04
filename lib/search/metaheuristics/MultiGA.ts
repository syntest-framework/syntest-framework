import {Fitness, GA, Objective} from "../..";
import {Sampler} from "../..";
import {Individual} from "../..";
import {getLogger} from "../..";
import {Target} from "../objective/Target";

/**
 * Genetic Algorithm BaseClass
 *
 * @author Dimitri Stallenberg
 */
export abstract class MultiGA<T extends GA> extends GA {
    get subAlgorithms(): GA[] {
        return this._subAlgorithms;
    }

    set subAlgorithms(value: GA[]) {
        this._subAlgorithms = value;
    }

    private _subAlgorithms: GA[]

    /**
     * Constructor
     * @param targets
     * @param fitness the fitness object
     * @param sampler the sampler object
     * @param GAtype the class of the sub algorithms to run (cannot be a MultiGA)
     */
    constructor (targets: Target[], fitness: Fitness, sampler: Sampler, GAtype: { new(target: Target, fitness: Fitness, sampler: Sampler): GA }) {
        super(targets[0], fitness, sampler)

        this._subAlgorithms = []

        for (let target of targets) {
            let ga: GA = new GAtype(target, fitness, sampler)

            this._subAlgorithms.push(ga)
        }
    }

    /**
     * The main search function which performs a certain amount of generations and writes the resulting test-suite to the folder.
     *
     * @param terminationCriteriaMet the function that decides whether the GA is done or not
     */
    async search (terminationCriteriaMet: (algorithmInstance: GA) => boolean) {
        for (let algorithm of this.subAlgorithms) {
            algorithm.population = algorithm.createInitialPopulation()
        }
        getLogger().info('Initial population created')

        for (let algorithm of this.subAlgorithms) {
           await algorithm.fitness.evaluateMany(algorithm.population, algorithm.objectives)
        }

        this.currentGeneration = 0
        this.startTime = Date.now()

        getLogger().info(`Search process started at ${(new Date(this.startTime)).toLocaleTimeString()}`)

        while (!terminationCriteriaMet(this)) {
            await this.multiGeneration()

            this.currentGeneration += 1
            this.timePast = Date.now() - this.startTime
            this.currentCoverage = this.getCurrentCoverage()
            getLogger().info(`Generation: ${this.currentGeneration} done after ${this.timePast / 1000} seconds, current coverage: ${this.currentCoverage}`)
        }

        getLogger().info(`The termination criteria have been satisfied.`)
        getLogger().info(`Ending the search process at ${(new Date(Date.now())).toLocaleTimeString()}`)
        return this.getFinalTestSuite()
    }

    /**
     * List of test cases that will for the final test suite
     * @protected
     */
    public getFinalTestSuite(): Map<Objective, Individual>{
        let champions: Map<Objective, Individual> = new Map<Objective, Individual>();
        for (let algorithm of this._subAlgorithms) {
            for (let key of algorithm.getFinalTestSuite().keys()) {
                champions.set(key, <Individual>algorithm.getFinalTestSuite().get(key))
            }
        }
        return champions
    }

    /**
     * The function to implement in child classes
     *
     * @param population the current population
     * @returns {[]} the population of the next generation
     */
     async generation (population: Individual[]): Promise<Individual[]> {
         throw new Error("MultiGA's cannot use the generation function, use multiGeneration instead")
    }

    abstract multiGeneration (): Promise<void>
}
