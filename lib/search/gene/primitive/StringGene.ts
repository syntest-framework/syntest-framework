import {PrimitiveGene} from '../PrimitiveGene'

import {getSetting, prng} from '../../..'
import {Sampler} from "../../..";

/**
 * @author Dimitri Stallenberg
 */
export class StringGene extends PrimitiveGene<string> {
    private readonly alphabet: string
    private readonly maxlength: number

    constructor(uniqueId: string, value: string, alphabet: string, maxlength: number) {
        super('string', 'string', uniqueId, value)
        this.alphabet = alphabet;
        this.maxlength = maxlength;
    }

    mutate(sampler: Sampler, depth: number): StringGene {
        if (prng.nextBoolean(getSetting("resample_gene_chance"))) {
            return sampler.sampleVariable(depth, this.getType())
        }

        if (this.value.length > 0 && this.value.length < this.maxlength) {
            let value = prng.nextInt(0, 3)

            if (value === 0) {
                return this.addMutation()
            } else if (value === 1) {
                return this.removeMutation()
            } else if (value === 2) {
                return this.replaceMutation()
            } else {
                return this.deltaMutation()
            }
        } else if (this.value.length > 0) {
            let value = prng.nextInt(0, 2)

            if (value === 0) {
                return this.removeMutation()
            } else if (value === 1) {
                return this.replaceMutation()
            } else {
                return this.deltaMutation()
            }
        } else {
            return this.addMutation()
        }
    }

    addMutation(): StringGene {
        let position = prng.nextInt(0, this.value.length - 1)
        let addedChar = prng.pickOne(this.alphabet)

        let newValue = ''

        for (let i = 0; i < this.value.length; i++) {
            if (i < position || i > position) {
                newValue += this.value[i]
            } else {
                newValue += addedChar
                newValue += this.value[i]
            }
        }

        return new StringGene(this.getId(), newValue, this.alphabet, this.maxlength)
    }

    removeMutation(): StringGene {
        let position = prng.nextInt(0, this.value.length - 1)

        let newValue = ''

        for (let i = 0; i < this.value.length; i++) {
            if (i === position) {
                continue
            }
            newValue += this.value[i]
        }

        return new StringGene(this.getId(), newValue, this.alphabet, this.maxlength)
    }

    replaceMutation(): StringGene {
        let position = prng.nextInt(0, this.value.length - 1)
        let newChar = prng.pickOne(this.alphabet)

        let newValue = ''

        for (let i = 0; i < this.value.length; i++) {
            if (i < position || i > position) {
                newValue += this.value[i]
            } else {
                newValue += newChar
            }
        }

        return new StringGene(this.getId(), newValue, this.alphabet, this.maxlength)
    }

    deltaMutation(): StringGene {
        let position = prng.nextInt(0, this.value.length - 1)
        let oldChar = this.value[position]
        let indexOldChar = this.alphabet.indexOf(oldChar)
        let delta = prng.pickOne([-2, -1, 1, -2])
        let newChar = this.alphabet[(indexOldChar + delta) % this.alphabet.length]

        let newValue = ''

        for (let i = 0; i < this.value.length; i++) {
            if (i < position || i > position) {
                newValue += this.value[i]
            } else {
                newValue += newChar
            }
        }

        return new StringGene(this.getId(), newValue, this.alphabet, this.maxlength)
    }

    copy () {
        return new StringGene(this.getId(), this.value, this.alphabet, this.maxlength)
    }

    static getRandom (alphabet = getSetting('string_alphabet'), maxlength=getSetting('string_maxlength')) {
        let valueLength = prng.nextInt(0, maxlength - 1)
        let value = ''

        for (let i = 0; i < valueLength; i++) {
            value += prng.pickOne(alphabet)
        }

        return new StringGene(prng.uniqueId(), value, alphabet, maxlength)
    }
}
