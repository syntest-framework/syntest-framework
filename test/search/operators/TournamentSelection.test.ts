import * as chai from "chai";
import {
  guessCWD,
  loadConfig,
  Objective,
  processConfig,
  setupLogger,
  setupOptions,
} from "../../../src";
import { DummyIndividual } from "../../mocks/DummyTestCase.mock";
import { tournamentSelection } from "../../../src/search/operators/selection/TournamentSelection";

const expect = chai.expect;

const mockMath = Object.create(global.Math);
mockMath.random = () => 0.5;
global.Math = mockMath;

/**
 * @author Annibale Panichella
 */
describe("Tournament selection", function () {
  before(async () => {
    await guessCWD(null);
    await setupOptions("", "");
    await loadConfig();
    await processConfig({}, "");
    await setupLogger();
  });

  it("Small Tournament size", () => {
    let objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    let objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    let ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);

    let ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [1, 1]);

    //fit('Null my value throws', () => {
    expect(() => {
      tournamentSelection([ind1, ind2], 1);
    }).throws("The tournament size should be greater than 1 ");
    // });
  });

  it("Comparison by rank", () => {
    let objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    let objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    let ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);
    ind1.setRank(0);
    ind1.setCrowdingDistance(10);

    let ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind2.setRank(1);
    ind2.setCrowdingDistance(2);

    let ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind3.setRank(2);
    ind3.setCrowdingDistance(1);

    let ind4 = new DummyIndividual();
    ind4.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind4.setRank(1);
    ind4.setCrowdingDistance(4);

    let winner: DummyIndividual = tournamentSelection(
      [ind2, ind1, ind3, ind4],
      20
    );
    expect(winner.getRank()).to.equal(0);
    expect(winner.getEvaluation().get(objective1)).to.equal(0);
    expect(winner.getEvaluation().get(objective2)).to.equal(1);
  });

  it("Comparison by crowding distance", () => {
    let objective1: Objective = { target: "mock", line: 1, locationIdx: 1 };
    let objective2: Objective = { target: "mock", line: 1, locationIdx: 2 };

    let ind1 = new DummyIndividual();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);
    ind1.setRank(0);
    ind1.setCrowdingDistance(10);

    let ind2 = new DummyIndividual();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind2.setRank(0);
    ind2.setCrowdingDistance(2);

    let ind3 = new DummyIndividual();
    ind3.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind3.setRank(0);
    ind3.setCrowdingDistance(1);

    let ind4 = new DummyIndividual();
    ind4.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind4.setRank(0);
    ind4.setCrowdingDistance(4);

    let winner: DummyIndividual = tournamentSelection(
      [ind2, ind1, ind3, ind4],
      20
    );
    expect(winner.getRank()).to.equal(0);
    expect(winner.getEvaluation().get(objective1)).to.equal(0);
    expect(winner.getEvaluation().get(objective2)).to.equal(1);
    expect(winner.getCrowdingDistance()).to.equal(10);
  });
});
