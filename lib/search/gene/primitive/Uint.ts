import {PrimitiveGene} from '../PrimitiveGene'
import {prng} from '../../../util/prng'
import {Sampler} from "../../sampling/Sampler";
import {getSetting} from "../../../util/Config";

/**
 * @author Dimitri Stallenberg
 */
export class Uint extends PrimitiveGene {
    private bits: number;
    constructor(uniqueId = prng.uniqueId(), value: number, bits: number) {
        super('unsignedInteger', `uint${bits}`, uniqueId, value)
        this.bits = bits
    }

    mutate(sampler: Sampler, depth: number) {
        if (prng.nextBoolean(getSetting("resample_gene_chance"))) {
            return sampler.sampleVariable(depth, this.getType())
        }

        if (prng.nextBoolean(getSetting("delta_mutation_chance"))) {
            return this.deltaMutation()
        }

        let bits = Math.min(this.bits, 16) // TODO fix this (something is wrong with the ints and uints as javascript does not support such large numbers (putting stuff in quotes would help maybe)

        let min = 0
        let max = (Math.pow(2, bits) - 1)

        return new Uint(this.getId(), prng.nextInt(min, max), this.bits)
    }

    deltaMutation() {
        // small mutation so maximum of 1024
        let bits = Math.min(this.bits, 10)

        let minChange = -(Math.pow(2, bits) - 1)
        let maxChange = (Math.pow(2, bits) - 1)
        let change = prng.nextInt(minChange, maxChange)

        let min = 0
        let max = (Math.pow(2, this.bits) - 1)

        return new Uint(this.getId(), Math.min(max, Math.max(min, this.value + change)), this.bits)
    }

    copy () {
        return new Uint(this.getId(), this.value, this.bits)
    }

    static getRandom (bits=256) {
        bits = Math.min(bits, 16) // TODO fix this (something is wrong with the ints and uints as javascript does not support such large numbers (putting stuff in quotes would help maybe)

        let min = 0
        let max = (Math.pow(2, bits) - 1)

        return new Uint(prng.uniqueId(), prng.nextInt(min, max), bits)
    }
}
