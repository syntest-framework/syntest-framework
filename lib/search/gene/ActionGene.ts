import {Gene} from "./Gene";
import {Sampler} from "../sampling/Sampler";

/**
 * @author Dimitri Stallenberg
 */
export abstract class ActionGene extends Gene {
    get args(): Gene[] {
        return this._args;
    }

    set args(value: Gene[]) {
        this._args = value;
    }
    private _args: Gene[];

    protected constructor(name: string, type: string, uniqueId: string, args: Gene[]) {
        super(name, type, uniqueId)
        this._args = args
    }

    abstract mutate(sampler: Sampler, depth: number): ActionGene

    abstract copy (): ActionGene

    hasChildren (): boolean {
        return !!this._args.length
    }

    getChildren (): Gene[] {
        return [...this._args]
    }

    setChild(index: number, child: Gene) {
        this._args[index] = child
    }
}

