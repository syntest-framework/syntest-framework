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
    const value = generator();

    return Math.round(value * (max - min)) + min;
  },
  nextDouble: (min = 0, max = Number.MAX_VALUE) => {
    const value = generator();

    return value * (max - min) + min;
  },
  /**
   * Uses the Box-Muller transform to get a gaussian random variable.
   *
   * Based on:
   * https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
   */
  nextGaussian: (mu = 0, sigma = 1) => {
    const u1 = generator();
    const u2 = generator();

    const mag = sigma * Math.sqrt(-2 * Math.log(u1));
    const z0 = mag * Math.cos(2 * Math.PI * u2) + mu;

    return z0;
  },
  pickOne: (options: any[] | string) => {
    if (!options.length) {
      throw new Error("Cannot pick one of an empty array!!!");
    }

    const value = generator();

    const index = Math.round(value * (options.length - 1));
    return options[index];
  },
  uniqueId: (length = 7) => {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(generator() * charactersLength));
    }
    return result;
  },
};
