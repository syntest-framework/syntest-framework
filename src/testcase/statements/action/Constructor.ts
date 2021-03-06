import {Statement} from "../Statement";
import {ActionStatement} from "../ActionStatement";

import {prng} from '../../../index'
import {Sampler} from "../../../index";
import {getProperty} from "../../../index";

/**
 * @author Dimitri Stallenberg
 */
export class Constructor extends ActionStatement {
    get constructorName(): string {
        return this._constructorName;
    }

    private _constructorName: string;

    /**
     * Constructor
     * @param constructorName the name of the function
     * @param type the return type of the function
     * @param args the arguments of the function
     * @param uniqueId optional argument
     */
    constructor(constructorName: string, type: string, uniqueId: string, args: Statement[]) {
        super('constructor', type, uniqueId, args)
        this._constructorName = constructorName
    }

    mutate(sampler: Sampler, depth: number) {
        if (prng.nextBoolean(getProperty("resample_gene_chance"))) {
            // resample the gene
            return sampler.sampleGene(depth, this.type, 'constructor')
        } else if (!this.args.length) {
            return this.copy()
        } else {
            // randomly pick one of the args
            let args = [...this.args.map((a: Statement) => a.copy())]
            let index = prng.nextInt(0, args.length - 1)
            args[index] = args[index].mutate(sampler, depth + 1)
            return new Constructor(this._constructorName, this.type, this.id, args)
        }
    }

    copy() {
        let deepCopyArgs = [...this.args.map((a: Statement) => a.copy())]
        return new Constructor(this._constructorName, this.type, this.id, deepCopyArgs)
    }
}
