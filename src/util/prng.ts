/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import BigNumber from "bignumber.js";
import { Properties } from "../properties";

const seedrandom = require("seedrandom");

let seed: any = null;
let random: any = null;

export function getSeed() {
  if (!seed) {
    seed = Properties.seed;

    if (!seed) {
      seed = `${seedrandom()()}`;
    }
  }
  return seed;
}

function generator() {
  if (!random) {
    random = seedrandom(getSeed());
  }

  return random();
}

/**
 * The global random generator.
 *
 * @author Dimitri Stallenberg
 */
export const prng = {
  nextBoolean: (trueChance = 0.5): boolean => {
    return generator() <= trueChance;
  },
  nextInt: (min = 0, max = Number.MAX_SAFE_INTEGER): number => {
    const value = generator();

    return Math.round(value * (max - min)) + min;
  },
  nextBigInt: (
    min: BigNumber = new BigNumber(0),
    max = new BigNumber(Number.MAX_SAFE_INTEGER)
  ): BigNumber => {
    const value = new BigNumber(generator());
    return value.multipliedBy(max.minus(min)).plus(min).integerValue();
  },
  nextDouble: (min = 0, max = Number.MAX_SAFE_INTEGER): number => {
    const value = generator();

    return value * (max - min) + min;
  },
  nextBigDouble: (
    min: BigNumber = new BigNumber(0),
    max = new BigNumber(Number.MAX_SAFE_INTEGER)
  ): BigNumber => {
    const value = new BigNumber(generator());
    return value.multipliedBy(max.minus(min)).plus(min);
  },
  /**
   * Uses the Box-Muller transform to get a gaussian random variable.
   *
   * Based on:
   * https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
   */
  nextGaussian: (mu = 0, sigma = 1): number => {
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
  uniqueId: (length = 7): string => {
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
