import {Statement} from "./Statement";
import {Sampler} from "../../../search/sampling/Sampler";

/**
 * @author Dimitri Stallenberg
 */
export abstract class ActionStatement extends Statement {
    get args(): Statement[] {
        return this._args;
    }

    set args(value: Statement[]) {
        this._args = value;
    }
    private _args: Statement[];

    protected constructor(name: string, type: string, uniqueId: string, args: Statement[]) {
        super(name, type, uniqueId)
        this._args = args
    }

    abstract mutate(sampler: Sampler, depth: number): ActionStatement

    abstract copy (): ActionStatement

    hasChildren (): boolean {
        return !!this._args.length
    }

    getChildren (): Statement[] {
        return [...this._args]
    }

    setChild(index: number, child: Statement) {
        this._args[index] = child
    }
}

