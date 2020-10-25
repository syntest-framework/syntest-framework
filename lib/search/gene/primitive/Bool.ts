import {PrimitiveGene} from '../PrimitiveGene'

import {prng} from '../../..'
import {Sampler} from "../../sampling/Sampler";

/**
 * @author Dimitri Stallenberg
 */
export class Bool extends PrimitiveGene {
    constructor(uniqueId: string, value: boolean) {
        super('boolean', 'bool', uniqueId, value)
    }

    mutate(sampler: Sampler, depth: number) {
        return new Bool(this.getId(), !this.value)
    }

    copy () {
        return new Bool(this.getId(), this.value)
    }

    static getRandom () {
        return new Bool(prng.uniqueId(), prng.nextBoolean())
    }
}
