import {PrimitiveGene} from '../PrimitiveGene'

import {prng} from '../../..'
import {Sampler} from "../../..";
import {getSetting} from "../../..";
import get = Reflect.get;

/**
 * @author Dimitri Stallenberg
 */
export class Int extends PrimitiveGene<number> {
    private readonly bits: number;

    constructor(uniqueId: string, value: number, bits: number) {
        super('integer', `int${bits}`, uniqueId, value)
        this.bits = bits
    }

    mutate(sampler: Sampler, depth: number): Int {
        if (prng.nextBoolean(getSetting("resample_gene_chance"))) {
            return sampler.sampleGene(depth, this.getType())
        }

        if (prng.nextBoolean(getSetting("delta_mutation_chance"))) {
            return this.deltaMutation()
        }

        let bits = Math.min(this.bits, 16) // TODO fix this (something is wrong with the ints and uints as javascript does not support such large numbers (putting stuff in quotes would help maybe)

        let min = -(Math.pow(2, bits) - 1)
        let max = (Math.pow(2, bits) - 1)

        return new Int(this.getId(), prng.nextInt(min, max), this.bits)
    }

    deltaMutation(): Int {
        // small mutation so maximum of 1024
        let bits = Math.min(this.bits, 10)

        let minChange = -(Math.pow(2, bits) - 1)
        let maxChange = (Math.pow(2, bits) - 1)
        let change = prng.nextInt(minChange, maxChange)

        let min = -(Math.pow(2, this.bits) - 1)
        let max = (Math.pow(2, this.bits) - 1)

        return new Int(this.getId(), Math.min(max, Math.max(min, this.value + change)), this.bits)
    }

    copy () {
        return new Int(this.getId(), this.value, this.bits)
    }

    static getRandom (bits=getSetting('int_bits')) {
        bits = Math.min(bits, 16) // TODO fix this (something is wrong with the ints and uints as javascript does not support such large numbers (putting stuff in quotes would help maybe)

        let min = -(Math.pow(2, bits) - 1)
        let max = (Math.pow(2, bits) - 1)

        return new Int(prng.uniqueId(), prng.nextInt(min, max), bits)
    }
}
