import {Sampler} from './Sampler'

import {prng} from '../../util/prng'
import {Individual} from '../gene/Individual'

import {FunctionCall} from '../gene/action/FunctionCall'

import {Bool} from '../gene/primitive/Bool'
import {Fixed} from '../gene/primitive/Fixed'
import {Ufixed} from '../gene/primitive/Ufixed'
import {Int} from '../gene/primitive/Int'
import {Uint} from '../gene/primitive/Uint'
import {Address} from '../gene/primitive/Address'
import {Gene} from "../gene/Gene";
import {GeneOptionManager} from "../gene/GeneOptionManager";
import {Constructor} from "../gene/action/Constructor";
import {getSetting} from "../../util/Config";
import {PrimitiveGene} from "../gene/PrimitiveGene";

/**
 * RandomSampler class
 *
 * @author Dimitri Stallenberg
 */
export class RandomSampler extends Sampler {
    /**
     * Constructor
     */
    constructor(geneOptionsObject: GeneOptionManager) {
        super(geneOptionsObject)
    }

    sampleIndividual () {
        let action = prng.pickOne(this.geneOptionsObject.possibleActions)
        let root = this.sampleFunctionCall(0, action.type)

        return new Individual(root)
    }

    sampleConstructor (depth: number): Constructor {
        // TODO arguments for constructors
        return new Constructor(this.geneOptionsObject.getConstructorName(), `${this.geneOptionsObject.getConstructorName()}Object`, prng.uniqueId(), [])
    }


    sampleArgument (depth: number, type: string): Gene {
        // check depth to decide whether to pick a variable
        if (depth >= getSetting("max_depth")) {
            // TODO or take an already available variable
            return this.sampleVariable(depth, type)
        }

        if (this.geneOptionsObject.possibleActions.filter((a) => a.type === type).length && prng.nextBoolean(getSetting("sample_func_as_arg"))) {
            // Pick function
            // TODO or take an already available functionCall

            return this.sampleFunctionCall(depth, type)
        } else {
            // Pick variable
            // TODO or take an already available variable

            return this.sampleVariable(depth, type)
        }
    }

    sampleVariable(depth: number, type: string): PrimitiveGene {
        // TODO constructor types
        if (type === 'bool') {
            return Bool.getRandom()
        } else if (type === 'address') {
            return Address.getRandom()
        } else if (type.includes('int')) {
            if (type.includes('uint')) {
                return Uint.getRandom()

            } else {
                return Int.getRandom()

            }
        } else if (type.includes('fixed')) {
            if (type.includes('ufixed')) {
                return Ufixed.getRandom()

            } else {
                return Fixed.getRandom()
            }
        }

        throw new Error('Unknown type text!')
    }

    sampleFunctionCall (depth: number, type: string): FunctionCall {
        let action = prng.pickOne(this.geneOptionsObject.possibleActions.filter((a) => a.type === type))

        let args: Gene[] = []

        for (let arg of action.args) {
            args.push(this.sampleArgument(depth + 1, arg.type))
        }

        let constructor = this.sampleConstructor(depth + 1)

        return new FunctionCall(constructor, action.name, action.type, prng.uniqueId(), args)
    }
}
