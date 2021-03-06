import {PrimitiveStatement} from '../PrimitiveStatement'

import {getProperty, prng, Sampler} from '../../../index'

/**
 * @author Dimitri Stallenberg
 */
export class Int extends PrimitiveStatement<number> {
    private readonly bits: number;

    constructor(uniqueId: string, value: number, bits: number) {
        super('integer', `int${bits}`, uniqueId, value)
        this.bits = bits
    }

    mutate(sampler: Sampler, depth: number): Int {
        if (prng.nextBoolean(getProperty("resample_gene_chance"))) {
            return sampler.sampleGene(depth, this.type, 'primitive')
        }

        if (prng.nextBoolean(getProperty("delta_mutation_chance"))) {
            return this.deltaMutation()
        }

        let bits = Math.min(this.bits, 16) // TODO fix this (something is wrong with the ints and uints as javascript does not support such large numbers (putting stuff in quotes would help maybe)

        let min = -(Math.pow(2, bits) - 1)
        let max = (Math.pow(2, bits) - 1)

        return new Int(this.id, prng.nextInt(min, max), this.bits)
    }

    deltaMutation(): Int {
        // small mutation so maximum of 1024
        let bits = Math.min(this.bits, 10)

        let minChange = -(Math.pow(2, bits) - 1)
        let maxChange = (Math.pow(2, bits) - 1)
        let change = prng.nextInt(minChange, maxChange)

        let min = -(Math.pow(2, this.bits) - 1)
        let max = (Math.pow(2, this.bits) - 1)

        return new Int(this.id, Math.min(max, Math.max(min, this.value + change)), this.bits)
    }

    copy() {
        return new Int(this.id, this.value, this.bits)
    }

    static getRandom(bits = getProperty('int_bits')) {
        bits = Math.min(bits, 16) // TODO fix this (something is wrong with the ints and uints as javascript does not support such large numbers (putting stuff in quotes would help maybe)

        let min = -(Math.pow(2, bits) - 1)
        let max = (Math.pow(2, bits) - 1)

        return new Int(prng.uniqueId(), prng.nextInt(min, max), bits)
    }
}
