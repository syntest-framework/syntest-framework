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

import { BranchObjectiveFunction } from "../../../lib/objective/BranchObjectiveFunction";
import { ApproachLevel } from "../../../lib/objective/heuristics/ApproachLevel";
import {
  computeAllButOneL2Norm,
  cornerSort,
  getSortedLists,
  zip,
} from "../../../lib/operators/ranking/CornerRanking";
import { DummyBranchDistance } from "../../mocks/DummyBranchDistance.mock";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";

const expect = chai.expect;

describe("Test PCSEA", function () {
  let objectives: Set<BranchObjectiveFunction<DummyEncodingMock>>;

  beforeEach(function () {
    const branchDistance = new DummyBranchDistance();

    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      branchDistance,
      undefined,
      "1"
    );
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      branchDistance,
      undefined,
      "1"
    );
    const objective3 = new BranchObjectiveFunction<DummyEncodingMock>(
      new ApproachLevel(),
      branchDistance,
      undefined,
      "1"
    );
    objectives = new Set<BranchObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);
    objectives.add(objective2);
    objectives.add(objective3);
  });

  it("Test zipping", () => {
    const array1 = ["h", "e", "l", "l", "o"];
    const array2 = [0, 1, 2, 3, 4];

    const zipped = zip(array1, array2);
    const expectedResult = [
      ["h", 0],
      ["e", 1],
      ["l", 2],
      ["l", 3],
      ["o", 4],
    ];
    expect(zipped).to.eql(expectedResult);
  });

  it("Test l2-norm computation", () => {
    const individual = new DummyEncodingMock();
    individual.setDummyEvaluation([...objectives], [10, 5, 4]);

    /*
        The number passed as the second argument marks the excluded objective's index.
        For the first test case, the first objective is excluded, meaning the result should be
        5^2 + 4^2, which gives 41.
        */
    expect(computeAllButOneL2Norm(individual, 0, [...objectives])).to.equal(41);

    expect(computeAllButOneL2Norm(individual, 1, [...objectives])).to.equal(
      116
    );

    expect(computeAllButOneL2Norm(individual, 2, [...objectives])).to.equal(
      125
    );
  });

  it("Test List Sorting with Simple Test Population", () => {
    const population = getSimpleTestPopulation(objectives);
    const sLists = getSortedLists(3, [...objectives.values()], 6, population);
    expect(sLists.length).to.equal(6);
    expect(sLists[0].length).to.equal(6);

    // Since the sorted lists contain indices instead of objects, 3 represents individual4 and so on...
    expect(sLists[0]).to.eql([3, 1, 2, 4, 5, 0]);
    expect(sLists[1]).to.eql([4, 3, 1, 0, 2, 5]);
    expect(sLists[2]).to.eql([5, 4, 0, 1, 2, 3]);
    expect(sLists[3]).to.eql([4, 0, 1, 5, 3, 2]);
    expect(sLists[4]).to.eql([4, 5, 1, 0, 2, 3]);
    expect(sLists[5]).to.eql([3, 1, 4, 2, 0, 5]);
  });

  it("Test List Sorting with Paper's Test Population", () => {
    const population = getPapersTestPopulation(objectives);
    const sLists = getSortedLists(3, [...objectives.values()], 12, population);
    expect(sLists.length).to.equal(6);
    expect(sLists[0].length).to.equal(12);
    expect(sLists[0]).to.eql([4, 11, 0, 10, 5, 6, 1, 2, 7, 3, 9, 8]);
    expect(sLists[5]).to.eql([10, 0, 6, 5, 2, 11, 7, 3, 1, 4, 9, 8]);
  });

  it("Test Corner Sort with Simple Test Population", () => {
    const p = getSimpleTestPopulation(objectives);
    const rankedPopulation = cornerSort(p, objectives, 6);

    const expectedResult = [p[3], p[4], p[5], p[0], p[1], p[2]];

    expect(rankedPopulation).to.eql(expectedResult);
  });

  // The following test was proposed by Singh et al. in PCSEA's paper in Section 3.
  it("Test Corner Sort with Paper's Test Population", () => {
    const p = getPapersTestPopulation(objectives);
    const rankedPopulation = cornerSort(p, objectives, 12);

    const expectedResult = [
      p[4],
      p[2],
      p[1],
      p[0],
      p[5],
      p[10],
      p[11],
      p[9],
      p[3],
      p[7],
      p[6],
      p[8],
    ];

    expect(rankedPopulation).to.eql(expectedResult);
  });
});

// This function returns the test population used to describe corner sort procedure in the PCSEA paper.
// The rankings can be the solutions can be found in Table 2 of the paper.
function getPapersTestPopulation(
  objectives: Set<BranchObjectiveFunction<DummyEncodingMock>>
): DummyEncodingMock[] {
  const ind1 = new DummyEncodingMock();
  ind1.setDummyEvaluation([...objectives], [0.0617, 0.1561, 0.1173]);

  const ind2 = new DummyEncodingMock();
  ind2.setDummyEvaluation([...objectives], [0.3924, 0.566, 0.0336]);

  const ind3 = new DummyEncodingMock();
  ind3.setDummyEvaluation([...objectives], [0.5446, 0.0183, 0.4089]);

  const ind4 = new DummyEncodingMock();
  ind4.setDummyEvaluation([...objectives], [0.6359, 0.2619, 0.0731]);

  const ind5 = new DummyEncodingMock();
  ind5.setDummyEvaluation([...objectives], [0.0365, 0.7365, 0.6474]);

  const ind6 = new DummyEncodingMock();
  ind6.setDummyEvaluation([...objectives], [0.2322, 0.4008, 0.0357]);

  const ind7 = new DummyEncodingMock();
  ind7.setDummyEvaluation([...objectives], [0.244, 0.3225, 0.1113]);

  const ind8 = new DummyEncodingMock();
  ind8.setDummyEvaluation([...objectives], [0.6014, 0.0876, 0.1886]);

  const ind9 = new DummyEncodingMock();
  ind9.setDummyEvaluation([...objectives], [0.9205, 0.196, 0.1153]);

  const ind10 = new DummyEncodingMock();
  ind10.setDummyEvaluation([...objectives], [0.7453, 0.0277, 0.2315]);

  const ind11 = new DummyEncodingMock();
  ind11.setDummyEvaluation([...objectives], [0.1123, 0.0914, 0.3017]);

  const ind12 = new DummyEncodingMock();
  ind12.setDummyEvaluation([...objectives], [0.0551, 0.5851, 0.7805]);

  return [
    ind1,
    ind2,
    ind3,
    ind4,
    ind5,
    ind6,
    ind7,
    ind8,
    ind9,
    ind10,
    ind11,
    ind12,
  ];
}

// This function returns a random test population I have created for corner-sort.
// Below is how the sorted lists and final result should look like

/*
Sorted on f1 : [4, 2, 3, 5, 6, 1]
Sorted on f2 : [5, 4, 2, 1, 3, 6]
Sorted on f3 : [6, 5, 1, 2, 3, 4]

Sorted on f2^2 + f3^2 : [5, 1, 2, 6, 4, 3]
Sorted on f1^2 + f3^2 : [5, 6, 2, 1, 3, 4]
Sorted on f1^2 + f2^2 : [4, 2, 5, 3, 1, 6]

Corner-Sorted : [4, 5, 6, 1, 2, 3]
 */
function getSimpleTestPopulation(
  objectives: Set<BranchObjectiveFunction<DummyEncodingMock>>
): DummyEncodingMock[] {
  const ind1 = new DummyEncodingMock();
  ind1.setDummyEvaluation([...objectives], [20, 9, 14]);

  const ind2 = new DummyEncodingMock();
  ind2.setDummyEvaluation([...objectives], [4, 7, 18]);

  const ind3 = new DummyEncodingMock();
  ind3.setDummyEvaluation([...objectives], [8, 13, 30]);

  const ind4 = new DummyEncodingMock();
  ind4.setDummyEvaluation([...objectives], [0, 5, 32]);

  const ind5 = new DummyEncodingMock();
  ind5.setDummyEvaluation([...objectives], [10, 0, 9]);

  const ind6 = new DummyEncodingMock();
  ind6.setDummyEvaluation([...objectives], [16, 21, 0]);

  return [ind1, ind2, ind3, ind4, ind5, ind6];
}
