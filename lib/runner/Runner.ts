import {SuiteBuilder} from "../testbuilding/SuiteBuilder";
import {Individual} from "../search/gene/Individual";

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

    abstract runTest(individual: Individual): Promise<Datapoint[]>
}