import BigNumber from "bignumber.js";
import {Properties} from "../properties";

const seedrandom = require("seedrandom");

let random: any = null;

function generator() {
  if (!random) {
    const seed = Properties.seed;

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
  nextBigInt: (
    min: BigNumber = new BigNumber(0),
    max = new BigNumber(Number.MAX_VALUE)
  ) => {
    const value = new BigNumber(generator());
    return value.multipliedBy(max.minus(min)).plus(min).integerValue();
  },
  nextDouble: (min = 0, max = Number.MAX_VALUE) => {
    const value = generator();

    return value * (max - min) + min;
  },
  nextBigDouble: (
    min: BigNumber = new BigNumber(0),
    max = new BigNumber(Number.MAX_VALUE)
  ) => {
    const value = new BigNumber(generator());
    return value.multipliedBy(max.minus(min)).plus(min);
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

    // first character should not be a digit
    result += characters.charAt(
      Math.floor(generator() * charactersLength - 10)
    );
    for (let i = 1; i < length; i++) {
      result += characters.charAt(Math.floor(generator() * charactersLength));
    }
    return result;
  },
};
