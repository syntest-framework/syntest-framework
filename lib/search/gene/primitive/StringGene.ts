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

        let options = []

        if (this.value.length < this.maxlength) {
            options.push(this.addMutation)
        }

        if (this.value.length > 0) {
            options.push(this.replaceMutation)
            options.push(this.deltaMutation)
            options.push(this.removeMutation)
        }

        let choice = prng.pickOne(options)
        return choice()
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

    static getRandom (alphabet ='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', maxlength=32) {
        let valueLength = prng.nextInt(0, maxlength - 1)
        let value = ''

        for (let i = 0; i < valueLength; i++) {
            value += prng.pickOne(alphabet)
        }

        return new StringGene(prng.uniqueId(), value, alphabet, maxlength)
    }
}
