/**
 * @author Dimitri Stallenberg
 */
import {Sampler} from "../sampling/Sampler";

export abstract class Gene {
    private name: string;
    private varName: string
    private type: string;
    private uniqueId: string;

    protected constructor(name: string, type: string, uniqueId: string) {
        this.name = name
        this.type = type
        this.uniqueId = uniqueId
        this.varName = type + uniqueId
    }

    abstract mutate(sampler: Sampler, depth: number): Gene

    abstract copy (): Gene

    abstract hasChildren (): boolean

    abstract getChildren (): Gene[]

    getName () {
        return this.name
    }

    getType () {
        return this.type
    }

    getId () {
        return this.uniqueId
    }

    getVarName () {
        return this.varName
    }
}

