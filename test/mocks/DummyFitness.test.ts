import {Fitness, Individual, Objective, Runner} from "../../lib";
import {CfgObject} from "../../lib/util/CfgObject";
import {Evaluation} from "../../lib/search/objective/Evaluation";

export class DummyFitness extends Fitness {

    private objectives: Objective[]

    constructor(cfg: CfgObject, runner: Runner, objectives: Objective[]) {
        super(cfg, runner);
        this.objectives = objectives
    }

    getPossibleObjectives (): Objective[] {
        return this.objectives
    }

    async evaluateMany (population: Individual[], objectives: Objective[]) {
        for (let individual of population) {
            let evaluation = new Evaluation()
            for (let i = 0; i < objectives.length; i++) {
                evaluation.set(objectives[i], 0)
            }

            individual.setEvaluation(evaluation)
        }
    }
}