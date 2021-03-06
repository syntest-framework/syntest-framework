import {ActionDescription, Fitness, Objective, Target} from "../../src";
import {DummyCFG} from "./DummyCFG.mock";

export class DummyTarget extends Target {

    private objectives: Objective[]

    constructor(objectives: Objective[]) {
        super('', new DummyCFG(),  null);
        this.objectives = objectives
    }

    getPossibleActions(type?: string, returnType?: string): ActionDescription[] {
        return [];
    }

    getObjectives (): Objective[] {
        return this.objectives;
    }

}