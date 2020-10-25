import {Gene} from "../Gene";
import {ActionGene} from "../ActionGene";
import {Constructor} from "./Constructor"
import {prng} from '../../..'
import {Sampler} from "../../sampling/Sampler";
import {getSetting} from "../../..";

/**
 * @author Dimitri Stallenberg
 */
export class FunctionCall extends ActionGene {
    get functionName(): string {
        return this._functionName;
    }

    set functionName(value: string) {
        this._functionName = value;
    }
    get instance(): Constructor {
        return this._instance;
    }

    set instance(value: Constructor) {
        this._instance = value;
    }

    private _instance: Constructor;
    private _functionName: string;

    /**
     * Constructor
     * @param instance the object to call the function on
     * @param functionName the name of the function
     * @param type the return type of the function
     * @param args the arguments of the function
     * @param uniqueId optional argument
     */
    constructor(instance: Constructor, functionName: string, type: string, uniqueId: string, args: Gene[]) {
        super('functionCall', type, uniqueId, args)
        this._instance = instance
        this._functionName = functionName
    }

    mutate(sampler: Sampler, depth: number) {
        // TODO maybe mutate the instance?

        if (prng.nextBoolean(getSetting("resample_gene_chance"))) {
            // resample the gene
            return sampler.sampleFunctionCall(depth, this.getType())
        } else if (!this.args.length) {
            return this.copy()
        } else {            // randomly pick one of the args
            let args = [...this.args.map((a: Gene) => a.copy())]
            let index = prng.nextInt(0, args.length - 1)
            args[index] = args[index].mutate(sampler, depth + 1)
            return new FunctionCall(this._instance, this._functionName, this.getType(), this.getId(), args)
        }
    }

    copy() {
        let deepCopyArgs = [...this.args.map((a: Gene) => a.copy())]
        return new FunctionCall(this._instance.copy(), this._functionName, this.getType(), this.getId(), deepCopyArgs)
    }

    hasChildren (): boolean {
        return true
    }

    getChildren (): Gene[] {
        return [...this.args, this._instance]
    }
}
