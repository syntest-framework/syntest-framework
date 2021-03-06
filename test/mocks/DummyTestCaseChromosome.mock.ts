import {Evaluation} from "../../src/search/objective/Evaluation";
import {TestCaseChromosome} from "../../src/testcase/TestCaseChromosome";
import {Constructor, Objective} from "../../src";

export class DummyIndividual extends TestCaseChromosome {

    private static counter: number = 0;

    constructor() {
        DummyIndividual.counter++
        let actionGene = new Constructor("dummy", "dummy", "dummy"+DummyIndividual.counter, [])
        super(actionGene)
    }


    public setDummyEvaluation(objective: Objective[], values: number[]) {
        let evaluation = new Evaluation();

        if (objective.length != values.length)
            throw new Error('Something bad happened');

        for (let i=0; i<objective.length; i++){
            evaluation.set(objective[i], values[i])
        }

        return this.setEvaluation(evaluation)
    }

}
