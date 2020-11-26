import {getSetting} from "../Config";

const seedrandom = require('seedrandom');

const seed = getSetting('seed')

let generator = seedrandom()

if (seed !== null) {
    generator = seedrandom(seed)
}

/**
 * @author Dimitri Stallenberg
 */

export const prng = {
    nextBoolean: (trueChance=0.5) => {
        return generator() < trueChance
    },
    nextInt: (min=0, max=Number.MAX_VALUE) => {
        let value = generator()

        return Math.round(value * (max - min)) + min
    },
    nextDouble: (min=0, max=Number.MAX_VALUE) => {
        let value = generator()

        return value * (max - min) + min
    },
    pickOne: (options: any[] | string) => {
        if (!options.length) {
            throw new Error('Cannot pick one of an empty array!!!')
        }

        let value = generator()

        let index = Math.round(value * (options.length - 1))
        return options[index]
    },
    uniqueId: (length = 7) => {
        let result           = '';
        let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(generator() * charactersLength));
        }
        return result;
    }

}
