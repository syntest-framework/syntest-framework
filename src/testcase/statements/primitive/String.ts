import {PrimitiveStatement} from '../PrimitiveStatement'

import {getProperty, prng} from '../../../index'
import {Sampler} from "../../../index";

/**
 * @author Dimitri Stallenberg
 */
export class String extends PrimitiveStatement<string> {
    private readonly alphabet: string
    private readonly maxlength: number

    constructor(uniqueId: string, value: string, alphabet: string, maxlength: number) {
        super('string', 'string', uniqueId, value)
        this.alphabet = alphabet;
        this.maxlength = maxlength;
    }

    mutate(sampler: Sampler, depth: number): String {
        if (prng.nextBoolean(getProperty("resample_gene_chance"))) {
            return sampler.sampleGene(depth, this.type, 'primitive')
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

    addMutation(): String {
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

        return new String(this.id, newValue, this.alphabet, this.maxlength)
    }

    removeMutation(): String {
        let position = prng.nextInt(0, this.value.length - 1)

        let newValue = ''

        for (let i = 0; i < this.value.length; i++) {
            if (i === position) {
                continue
            }
            newValue += this.value[i]
        }

        return new String(this.id, newValue, this.alphabet, this.maxlength)
    }

    replaceMutation(): String {
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

        return new String(this.id, newValue, this.alphabet, this.maxlength)
    }

    deltaMutation(): String {
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

        return new String(this.id, newValue, this.alphabet, this.maxlength)
    }

    copy () {
        return new String(this.id, this.value, this.alphabet, this.maxlength)
    }

    static getRandom (alphabet = getProperty('string_alphabet'), maxlength=getProperty('string_maxlength')) {
        let valueLength = prng.nextInt(0, maxlength - 1)
        let value = ''

        for (let i = 0; i < valueLength; i++) {
            value += prng.pickOne(alphabet)
        }

        return new String(prng.uniqueId(), value, alphabet, maxlength)
    }
}
