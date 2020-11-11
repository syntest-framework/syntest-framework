import {PrimitiveGene} from '../PrimitiveGene'

import {getSetting, prng} from '../../..'
import {Sampler} from "../../..";

/**
 * @author Dimitri Stallenberg
 */
export class Address extends PrimitiveGene<string> {
    constructor(uniqueId: string, value: string) {
        super('address', 'address', uniqueId, value)
    }

    mutate(sampler: Sampler, depth: number) {
        if (prng.nextBoolean(getSetting("resample_gene_chance"))) {
            return sampler.sampleVariable(depth, this.getType())
        }
        // TODO
        return new Address(this.getId(), this.value)
    }

    copy () {
        return new Address(this.getId(), this.value)
    }

    static getRandom () {
        // TODO
        return new Address(prng.uniqueId(), 'accounts[0]')
    }
}
