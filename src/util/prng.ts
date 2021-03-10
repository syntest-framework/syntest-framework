import { getProperty } from "../config";

const seedrandom = require("seedrandom");

let random: any = null;

function generator() {
  if (!random) {
    const seed = getProperty("seed");

    random = seedrandom();

    if (seed !== null) {
      random = seedrandom(seed);
    }
  }

  return random();
}

/**
 * The global random generator.
 *
 * @author Dimitri Stallenberg
 */
export const prng = {
  nextBoolean: (trueChance = 0.5) => {
    return generator() <= trueChance;
  },
  nextInt: (min = 0, max = Number.MAX_VALUE) => {
    let value = generator();

    return Math.round(value * (max - min)) + min;
  },
  nextDouble: (min = 0, max = Number.MAX_VALUE) => {
    let value = generator();

    return value * (max - min) + min;
  },
  /**
   * Uses the Box-Muller transform to get a gaussian random variable.
   *
   * Based on:
   * https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
   */
  nextGaussian: (mu: number = 0, sigma: number = 1) => {
    let u1 = generator();
    let u2 = generator();

    let mag = sigma * Math.sqrt(-2 * Math.log(u1));
    let z0 = mag * Math.cos(2 * Math.PI * u2) + mu;

    return z0;
  },
  pickOne: (options: any[] | string) => {
    if (!options.length) {
      throw new Error("Cannot pick one of an empty array!!!");
    }

    let value = generator();

    let index = Math.round(value * (options.length - 1));
    return options[index];
  },
  uniqueId: (length = 7) => {
    let result = "";
    let characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(generator() * charactersLength));
    }
    return result;
  },
};
