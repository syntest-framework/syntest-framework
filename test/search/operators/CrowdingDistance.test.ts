import * as chai from "chai";
import {
  crowdingDistance,
  guessCWD,
  loadConfig,
  Objective,
  processConfig,
  setupLogger,
  setupOptions,
} from "../../../src";
import { DummyIndividual } from "../../mocks/DummyTestCase.mock";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */

describe("Crowding distance", function () {
  beforeEach(async () => {
    await guessCWD(null);
    await setupOptions("", "");
    await loadConfig();
    await processConfig({}, "");
    await setupLogger();
  });

  it("empty front", () => {
    crowdingDistance([]);
  });

  it("front with one solution", () => {
    const ind = new DummyIndividual();
    crowdingDistance([ind]);
    expect(ind.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
  });

  it("front with two solutions", () => {
    const ind1 = new DummyIndividual();
    const ind2 = new DummyIndividual();

    crowdingDistance([ind1, ind2]);
    expect(ind1.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
    expect(ind2.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
  });

  it("Front with more than two solutions", () => {
    const objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    const objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [2, 0]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [1, 1]);

    crowdingDistance([ind1, ind2, ind3]);
    expect(ind1.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
    expect(ind2.getCrowdingDistance()).to.equal(Number.POSITIVE_INFINITY);
    expect(ind3.getCrowdingDistance()).to.equal(2);
  });

  it("Corner case with same obj values for all individual", () => {
    const objective: Objective = { target: "mock", line: 1, locationIdx: 1 };

    const ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective], [1]);

    const ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective], [1]);

    const ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective], [1]);

    crowdingDistance([ind1, ind2, ind3]);
    expect(ind1.getCrowdingDistance()).to.equal(0);
    expect(ind2.getCrowdingDistance()).to.equal(0);
    expect(ind3.getCrowdingDistance()).to.equal(0);
  });
});
