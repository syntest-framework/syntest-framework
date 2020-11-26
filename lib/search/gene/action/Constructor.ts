import {Gene} from "../Gene";
import {ActionGene} from "../ActionGene";

import {prng} from '../../..'
import {Sampler} from "../../..";
import {getProperty} from "../../..";

/**
 * @author Dimitri Stallenberg
 */
export class Constructor extends ActionGene {
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
    constructor(constructorName: string, type: string, uniqueId: string, args: Gene[]) {
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
            let args = [...this.args.map((a: Gene) => a.copy())]
            let index = prng.nextInt(0, args.length - 1)
            args[index] = args[index].mutate(sampler, depth + 1)
            return new Constructor(this._constructorName, this.type, this.id, args)
        }
    }

    copy() {
        let deepCopyArgs = [...this.args.map((a: Gene) => a.copy())]
        return new Constructor(this._constructorName, this.type, this.id, deepCopyArgs)
    }
}
