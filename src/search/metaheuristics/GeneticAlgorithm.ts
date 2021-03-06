import {Fitness, getLogger, getProperty, Objective, Sampler, TestCase} from "../..";
import {endOverTimeWriterIfExists, startOverTimeWriter, writeData, writeSummary} from "../../util/resultWriter";
import {Target} from "../objective/Target";

/**
 * Genetic Algorithm BaseClass
 *
 * @author Dimitri Stallenberg
 */
export abstract class GeneticAlgorithm {
    get population(): TestCase[] {
        return this._population;
    }

    set population(value: TestCase[]) {
        this._population = value;
    }

    get archive(): Map<Objective, TestCase> {
        return this._archive;
    }

    set archive(value: Map<Objective, TestCase>) {
        this._archive = value;
    }

    get startTime(): number {
        return this._startTime;
    }

    set startTime(value: number) {
        this._startTime = value;
    }

    get currentGeneration(): number {
        return this._currentGeneration;
    }

    set currentGeneration(value: number) {
        this._currentGeneration = value;
    }

    get timePast(): number {
        return this._timePast;
    }

    set timePast(value: number) {
        this._timePast = value;
    }

    get currentCoverage(): number {
        return this._currentCoverage;
    }

    set currentCoverage(value: number) {
        this._currentCoverage = value;
    }

    get objectives(): Objective[] {
        return this._objectives;
    }

    set objectives(value: Objective[]) {
        this._objectives = value;
    }

    get fitness(): Fitness {
        return this._fitness;
    }

    get sampler(): Sampler {
        return this._sampler;
    }

    get popsize(): number {
        return this._popsize;
    }


    get target(): Target {
        return this._target;
    }

    set target(value: Target) {
        this._target = value;
    }

    private readonly _fitness: Fitness;
    private readonly _sampler: Sampler;
    private readonly _popsize: number;

    private _population: TestCase[];
    private _archive: Map<Objective, TestCase>;

    private _startTime: number;
    private _currentGeneration: number;
    private _timePast: number;
    private _currentCoverage: number;

    private _target: Target
    private _objectives: Objective[]

    /**
     * Constructor
     * @param target
     * @param fitness the fitness object
     * @param sampler the sampler object
     */
    constructor(target: Target, fitness: Fitness, sampler: Sampler) {
        this._target = target
        this._fitness = fitness
        this._sampler = sampler
        this._popsize = getProperty('population_size')
        this._population = []
        this._startTime = Date.now()

        this._currentGeneration = 0
        this._timePast = 0
        this._currentCoverage = 0

        this._objectives = target.getObjectives()


        this.setupArchive()
    }

    /**
     * Creates a Map
     */
    private setupArchive() {
        const ga = this

        class MyMap extends Map<Objective, TestCase> {
            set(key: Objective, value: TestCase) {
                writeData(ga, key)
                return super.set(key, value);
            }
        }

        this._archive = new MyMap()
    }

    /**
     * Create a random initial population.
     *
     * @returns {[]} the create population
     */
    createInitialPopulation(): TestCase[] {
        let population: TestCase[] = []

        for (let i = 0; i < this._popsize; i++) {
            population.push(this._sampler.sampleIndividual())
        }

        return population
    }

    /**
     * The main search function which performs a certain amount of generations and writes the resulting test-suite to the folder.
     *
     * @param terminationCriteriaMet the function that decides whether the genetic algorithm is done or not
     */
    async search(terminationCriteriaMet: (algorithmInstance: GeneticAlgorithm) => boolean) {
        this._population = this.createInitialPopulation()
        getLogger().info('Initial population created')
        startOverTimeWriter(this)
        await this._fitness.evaluateMany(this._population, this.objectives)

        this._currentGeneration = 0
        this._startTime = Date.now()

        getLogger().info(`Search process started at ${(new Date(this._startTime)).toLocaleTimeString()}`)

        while (!terminationCriteriaMet(this)) {
            this._population = await this.generation(this._population)
            this._currentGeneration += 1
            this._timePast = Date.now() - this._startTime
            this._currentCoverage = this.getCurrentCoverage()
            getLogger().info(`Generation: ${this._currentGeneration} done after ${this._timePast / 1000} seconds, current coverage: ${this._currentCoverage.toFixed(2)} \%`)
        }

        endOverTimeWriterIfExists()
        writeSummary(this)
        getLogger().info(`The termination criteria have been satisfied.`)
        getLogger().info(`Ending the search process at ${(new Date(Date.now())).toLocaleTimeString()}`)
        return this.getFinalTestSuite()
    }

    /**
     * List of test cases that will for the final test suite
     * @protected
     */
    public getFinalTestSuite(): Map<Objective, TestCase> {
        return this._archive
    }

    /**
     * The function to implement in child classes.
     * Should return the sorted population of the next generation.
     *
     * @param population the current population
     * @returns {[]} the sorted population of the next generation
     */
    abstract generation(population: TestCase[]): Promise<TestCase[]>

    abstract getCurrentCoverage(): number
}
