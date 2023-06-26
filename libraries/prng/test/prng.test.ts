/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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
import * as chai from "chai";

import { prng } from "../lib/prng";

const expect = chai.expect;

describe("PRNG", () => {
  it("Gaussian random variables follow a gaussian distribution", () => {
    const samples = 100_000;
    const mu = 5;
    const sigma = 2;

    const values = [];
    let mean = 0;
    let std = 0;

    for (let index = 0; index < samples; index++) {
      const value = prng.nextGaussian(mu, sigma);
      mean += value;
      values.push(value);
    }

    mean /= samples;

    for (let index = 0; index < samples; index++) {
      const value = values[index];
      std += Math.pow(value - mean, 2);
    }

    std = Math.sqrt(std / samples);

    expect(mean).to.be.closeTo(mu, 0.05);
    expect(std).to.be.closeTo(sigma, 0.05);
  });
});
