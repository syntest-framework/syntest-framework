import {TestCase} from "../../../index";

export interface Selection {
    select(population: TestCase[], amount: number): TestCase[]
}
