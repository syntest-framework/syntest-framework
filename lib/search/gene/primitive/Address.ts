import {PrimitiveGene} from '../PrimitiveGene'

import {prng} from '../../..'
import {Sampler} from "../../sampling/Sampler";

/**
 * @author Dimitri Stallenberg
 */
export class Address extends PrimitiveGene {
    constructor(uniqueId: string, value: string) {
        super('address', 'address', uniqueId, value)
    }

    mutate(sampler: Sampler, depth: number) {
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
