import {SuiteBuilder} from "../testbuilding/SuiteBuilder";
import {TestCaseChromosome} from "../testcase/TestCaseChromosome";

export interface Datapoint {
    type: string
    locationIdx: number
    line: number

    hits: number

    opcode: string
    left: number
    right: number
}

export abstract class Runner {
    get suiteBuilder(): SuiteBuilder {
        return this._suiteBuilder;
    }

    private _suiteBuilder: SuiteBuilder

    constructor(suiteBuilder: SuiteBuilder) {
        this._suiteBuilder = suiteBuilder
    }

    abstract runTest(individual: TestCaseChromosome): Promise<Datapoint[]>
}