import {TestCase} from "../../../index";

export interface Ranking {
    rank(population: TestCase[]): void
}
