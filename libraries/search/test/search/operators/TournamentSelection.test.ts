/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { BranchObjectiveFunction } from "../../../lib/objective/BranchObjectiveFunction";
import { ApproachLevel } from "../../../lib/objective/heuristics/ApproachLevel";
import { tournamentSelection } from "../../../lib/operators/selection/TournamentSelection";
import { minimumValue } from "../../../lib/util/diagnostics";
import { DummyBranchDistance } from "../../mocks/DummyBranchDistance.mock";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";

const expect = chai.expect;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const mockMath = Object.create(global.Math);
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
mockMath.random = () => 0.5;
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
global.Math = mockMath;

/**
 * @author Annibale Panichella
 */
describe("Tournament selection", function () {
  it("Small Tournament size", () => {
    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      new DummyBranchDistance(),
      undefined,
      "1"
    );
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      new DummyBranchDistance(),
      undefined,
      "1"
    );

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([objective1, objective2], [1, 1]);

    //fit('Null my value throws', () => {
    expect(() => {
      tournamentSelection([ind1, ind2], 1);
    }).throws(minimumValue("tournament size", 2, 1));
  });

  it("Comparison by rank", () => {
    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      new DummyBranchDistance(),
      undefined,
      "1"
    );
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      new DummyBranchDistance(),
      undefined,
      "1"
    );

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);
    ind1.setRank(0);
    ind1.setCrowdingDistance(10);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind2.setRank(1);
    ind2.setCrowdingDistance(2);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind3.setRank(2);
    ind3.setCrowdingDistance(1);

    const ind4 = new DummyEncodingMock();
    ind4.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind4.setRank(1);
    ind4.setCrowdingDistance(4);

    const winner: DummyEncodingMock = tournamentSelection(
      [ind1, ind2, ind3, ind4],
      20
    );
    expect(winner.getRank()).to.equal(0);
    expect(winner.getDistance(objective1)).to.equal(0);
    expect(winner.getDistance(objective2)).to.equal(1);
  });

  it("Comparison by crowding distance", () => {
    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      new DummyBranchDistance(),
      undefined,
      "1"
    );
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      new DummyBranchDistance(),
      undefined,
      "1"
    );

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);
    ind1.setRank(0);
    ind1.setCrowdingDistance(10);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind2.setRank(0);
    ind2.setCrowdingDistance(2);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind3.setRank(0);
    ind3.setCrowdingDistance(1);

    const ind4 = new DummyEncodingMock();
    ind4.setDummyEvaluation([objective1, objective2], [0, 2]);
    ind4.setRank(0);
    ind4.setCrowdingDistance(4);

    const winner: DummyEncodingMock = tournamentSelection(
      [ind2, ind1, ind3, ind4],
      20
    );
    expect(winner.getRank()).to.equal(0);
    expect(winner.getDistance(objective1)).to.equal(0);
    expect(winner.getDistance(objective2)).to.equal(1);
    expect(winner.getCrowdingDistance()).to.equal(10);
  });
});
