import {PrimitiveStatement} from '../PrimitiveStatement'

import {getProperty, prng, Sampler} from '../../../index'

/**
 * @author Dimitri Stallenberg
 */
export class Bool extends PrimitiveStatement<boolean> {
    constructor(uniqueId: string, value: boolean) {
        super('boolean', 'bool', uniqueId, value)
    }

    mutate(sampler: Sampler, depth: number) {
        if (prng.nextBoolean(getProperty("resample_gene_chance"))) {
            return sampler.sampleGene(depth, this.type, 'primitive')
        }
        return new Bool(this.id, !this.value)
    }

    copy() {
        return new Bool(this.id, this.value)
    }

    static getRandom() {
        return new Bool(prng.uniqueId(), prng.nextBoolean())
    }
}
