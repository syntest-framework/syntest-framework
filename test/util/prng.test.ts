import * as chai from "chai";
import { prng } from "../../src";

const expect = chai.expect;

describe("PRNG", () => {
  it("Gaussian random variables follow a gaussian distribution", () => {
    const samples = 100000;
    const mu = 5;
    const sigma = 2;

    const values = [];
    let mean = 0;
    let std = 0;

    for (let i = 0; i < samples; i++) {
      const value = prng.nextGaussian(mu, sigma);
      mean += value;
      values.push(value);
    }

    mean /= samples;

    for (let i = 0; i < samples; i++) {
      const value = values[i];
      std += Math.pow(value - mean, 2);
    }

    std = Math.sqrt(std / samples);

    expect(mean).to.be.closeTo(mu, 0.05);
    expect(std).to.be.closeTo(sigma, 0.05);
  });
});
