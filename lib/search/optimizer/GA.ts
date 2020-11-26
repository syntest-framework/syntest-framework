import {Fitness} from "../..";
import {GeneOptionManager} from "../..";
import {Sampler} from "../..";
import {Individual} from "../..";
import {getProperty} from "../..";
import {getLogger} from "../..";
import {Objective} from "../..";

/**
 * Genetic Algorithm BaseClass
 *
 * @author Dimitri Stallenberg
 */
export abstract class GA {
    get popsize(): number {
        return this._popsize;
    }

    get population(): Individual[] {
        return this._population;
    }
    get sampler(): Sampler {
        return this._sampler;
    }
    get geneOptions(): GeneOptionManager {
        return this._geneOptions;
    }
    get fitness(): Fitness {
        return this._fitness;
    }
    get objectives(): Objective[] {
        return this._objectives;
    }
    set objectives(value: Objective[]) {
        this._objectives = value;
    }
    get currentCoverage(): number {
        return this._currentCoverage;
    }
    get timePast(): number {
        return this._timePast;
    }
    get currentGeneration(): number {
        return this._currentGeneration;
    }

    private readonly _fitness: Fitness;
    private readonly _geneOptions: GeneOptionManager;
    private readonly _sampler: Sampler;
    private readonly _popsize: number;

    private _population: Individual[];
    private _archive: Individual[];

    private startTime: number;
    private _currentGeneration: number;
    private _timePast: number;
    private _currentCoverage: number;

    private _objectives: Objective[]

    /**
     * Constructor
     * @param fitness the fitness object
     * @param geneOptions the gene options object
     * @param sampler the sampler object
     */
    constructor (fitness: Fitness, geneOptions: GeneOptionManager, sampler: Sampler) {
        this._fitness = fitness
        this._geneOptions = geneOptions
        this._sampler = sampler
        this._popsize = getProperty('population_size')
        this._population = []
        this._archive = []
        this.startTime = Date.now()

        this._currentGeneration = 0
        this._timePast = 0
        this._currentCoverage = 0

        this._objectives = fitness.getPossibleObjectives()
    }

    /**
     * Create a random initial population.
     *
     * @returns {[]} the create population
     */
    createInitialPopulation (): Individual[] {
        let population: Individual[] = []

        for (let i = 0; i < this._popsize; i++) {
            population.push(this._sampler.sampleIndividual())
        }

        return population
    }

    /**
     * The main search function which performs a certain amount of generations and writes the resulting test-suite to the folder.
     *
     * @param terminationCriteriaMet the function that decides whether the GA is done or not
     */
    async search (terminationCriteriaMet: (algorithmInstance: GA) => boolean) {
        this._population = this.createInitialPopulation()
        getLogger().info('Initial population created')

        await this._fitness.evaluateMany(this._population, this.objectives)

        this._currentGeneration = 0
        this.startTime = Date.now()

        getLogger().info(`Search process started at ${(new Date(this.startTime)).toLocaleTimeString()}`)

        while (!terminationCriteriaMet(this)) {
            this._population = await this.generation(this._population)
            this._currentGeneration += 1
            this._timePast = Date.now() - this.startTime
            this._currentCoverage = this.getCurrentCoverage()
            getLogger().info(`Generation: ${this._currentGeneration} done after ${this._timePast / 1000} seconds, current coverage: ${this._currentCoverage}`)
        }

        getLogger().info(`The termination criteria have been satisfied.`)
        getLogger().info(`Ending the search process at ${(new Date(Date.now())).toLocaleTimeString()}`)
        return this.getFinalTestSuite()
    }

    /** List of test cases that will for the final test suite
     * @protected
     */
    protected getFinalTestSuite(): Individual[]{
        return this._population
    }

    /**
     * The function to implement in child classes
     *
     * @param population the current population
     * @returns {[]} the population of the next generation
     */
    abstract generation (population: Individual[]): Promise<Individual[]>

    abstract getCurrentCoverage (): number
}
