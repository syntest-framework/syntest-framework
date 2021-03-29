import {TestCase} from "../../index";

export interface Operator {
    operate(population: TestCase[]): TestCase[]
}
