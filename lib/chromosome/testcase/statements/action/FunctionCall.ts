import {Statement} from "../Statement";
import {ActionStatement} from "../ActionStatement";
import {prng} from '../../../../index'
import {Sampler} from "../../../../index";
import {getProperty} from "../../../../index";

/**
 * @author Dimitri Stallenberg
 */
export class FunctionCall extends ActionStatement {
    get functionName(): string {
        return this._functionName;
    }

    set functionName(value: string) {
        this._functionName = value;
    }

    private _functionName: string;

    /**
     * Constructor
     * @param instance the object to call the function on
     * @param functionName the name of the function
     * @param type the return type of the function
     * @param args the arguments of the function
     * @param uniqueId optional argument
     */
    constructor(functionName: string, type: string, uniqueId: string, args: Statement[]) {
        super('functionCall', type, uniqueId, [...args])
        this._functionName = functionName
    }

    mutate(sampler: Sampler, depth: number) {
        if (prng.nextBoolean(getProperty("resample_gene_chance"))) {
            // resample the gene
            return sampler.sampleGene(depth, this.type, 'functionCall')
        } else if (!this.args.length) {
            return this.copy()
        } else {            // randomly pick one of the args
            let args = [...this.args.map((a: Statement) => a.copy())]
            let index = prng.nextInt(0, args.length - 1)
            args[index] = args[index].mutate(sampler, depth + 1)

            return new FunctionCall(this._functionName, this.type, this.id, args)
        }
    }

    copy() {
        let deepCopyArgs = [...this.args.map((a: Statement) => a.copy())]

        return new FunctionCall(this._functionName, this.type, this.id, deepCopyArgs)
    }

    hasChildren (): boolean {
        return true
    }

    getChildren (): Statement[] {
        return [...this.args]
    }
}
