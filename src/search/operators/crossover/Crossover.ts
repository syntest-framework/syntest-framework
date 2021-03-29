import {TestCase} from "../../../index";

export interface Crossover {
    crossover(population: TestCase[]): TestCase[]
}
