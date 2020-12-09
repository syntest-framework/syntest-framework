import {PrimitiveGene} from '../PrimitiveGene'

import {getProperty, prng} from '../../..'
import {Sampler} from "../../..";

/**
 * @author Dimitri Stallenberg
 */
export class Address extends PrimitiveGene<string> {
    constructor(uniqueId: string, value: string) {
        super('address', 'address', uniqueId, value)
    }

    mutate(sampler: Sampler, depth: number) {
        if (prng.nextBoolean(getProperty("resample_gene_chance"))) {
            return sampler.sampleGene(depth, this.type, 'primitive')
        }
        // TODO
        return new Address(this.id, this.value)
    }

    copy () {
        return new Address(this.id, this.value)
    }

    static getRandom () {
        // TODO
        return new Address(prng.uniqueId(), 'accounts[0]')
    }
}
