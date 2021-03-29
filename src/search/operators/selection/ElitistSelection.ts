import { TestCase } from "../../..";
import { Selection } from "./Selection";

export class ElitistSelection implements Selection {

    /**
     * This function selects the individual for reproduction using tournament selection
     * @param population the population from which to select a parent
     * @param amount the amount of test cases to select
     * @returns TestCase selected individual
     *
     * @author Annibale Panichella
     */
    select(population: TestCase[], amount: number): TestCase[] {
        population.sort((a, b) => {
            return a.getRank() - b.getRank()
        })

        let selection = []

        for (let i = 0; i < amount; i++) {
            selection.push(population[i])
        }

        return selection;
    }
}
