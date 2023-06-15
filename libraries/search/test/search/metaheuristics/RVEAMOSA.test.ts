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
import { expect } from "chai";

import { EncodingRunner } from "../../../lib/EncodingRunner";
import { EncodingSampler } from "../../../lib/EncodingSampler";
import { BranchObjectiveFunction } from "../../../lib/objective/BranchObjectiveFunction";
import { ApproachLevel } from "../../../lib/objective/heuristics/ApproachLevel";
import { UncoveredObjectiveManager } from "../../../lib/objective/managers/UncoveredObjectiveManager";
import { DummyBranchDistance } from "../../mocks/DummyBranchDistance.mock";
import { DummyCrossover } from "../../mocks/DummyCrossover.mock";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";
import { DummyProcreation } from "../../mocks/DummyProcreation.mock";
import { DummySearchSubject } from "../../mocks/DummySubject.mock";
import { MockedRVEAMOSA } from "../../mocks/RVEAMOSAAdapter";

describe("Test RVEAMOSA", function () {
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
    objectives = new Set<BranchObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);
    objectives.add(objective2);
  });

  it("Test Full Environmental Selection with 5 individuals", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([...objectives], [2, 3]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([...objectives], [0, 2]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([...objectives], [2, 0]);

    const ind4 = new DummyEncodingMock();
    ind4.setDummyEvaluation([...objectives], [1, 1]);

    const ind5 = new DummyEncodingMock();
    ind5.setDummyEvaluation([...objectives], [3, 2]);

    const searchSubject = new DummySearchSubject([...objectives]);

    const mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = new DummyCrossover(0.8, 0.8);
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );
    const rveaMosa = new MockedRVEAMOSA(
      new UncoveredObjectiveManager(mockedRunner, new Set()),
      mockedSampler,
      mockedProcreation,
      4
    );

    rveaMosa.setPopulation([ind1, ind2, ind3, ind4, ind5], 4);
    rveaMosa.updateObjectives(searchSubject);
    const alpha = 2;
    const progress = 0; // t/t_max
    const fr = 0.2;
    rveaMosa.environmentalSelection(4, alpha, progress, fr);

    expect(rveaMosa.getPopulation().length).to.equal(4);
    expect(rveaMosa.getPopulation()).contain(ind1);
    expect(rveaMosa.getPopulation()).contain(ind2);
    expect(rveaMosa.getPopulation()).contain(ind3);
    expect(rveaMosa.getPopulation()).contain(ind4);

    const expected = [
      [0, 2],
      [2, 0],
      [1, 1],
      [2, 3],
    ];
    for (const [index, individual] of rveaMosa.getPopulation().entries()) {
      let count = 0;
      for (const objective of objectives) {
        expect(individual.getDistance(objective)).equal(
          expected[index][count],
          `The ${index} individual seems to mismatch`
        );
        count = count + 1;
      }
    }
  });

  it("Test Full Environmental Selection with 11 individuals", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([...objectives], [5, 20]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([...objectives], [7, 12]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([...objectives], [8, 18]);

    const ind4 = new DummyEncodingMock();
    ind4.setDummyEvaluation([...objectives], [10, 7]);

    const ind5 = new DummyEncodingMock();
    ind5.setDummyEvaluation([...objectives], [13, 13]);

    const ind6 = new DummyEncodingMock();
    ind6.setDummyEvaluation([...objectives], [15, 26]);

    const ind7 = new DummyEncodingMock();
    ind7.setDummyEvaluation([...objectives], [18, 4]);

    const ind8 = new DummyEncodingMock();
    ind8.setDummyEvaluation([...objectives], [21, 3]);

    const ind9 = new DummyEncodingMock();
    ind9.setDummyEvaluation([...objectives], [24, 9]);

    const ind10 = new DummyEncodingMock();
    ind10.setDummyEvaluation([...objectives], [27, 16]);

    const ind11 = new DummyEncodingMock();
    ind11.setDummyEvaluation([...objectives], [31, 1]);

    const searchSubject = new DummySearchSubject([...objectives]);

    const mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = new DummyCrossover(0.8, 0.8);
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );
    const rveaMosa = new MockedRVEAMOSA(
      new UncoveredObjectiveManager(mockedRunner, new Set()),
      mockedSampler,
      mockedProcreation,
      6
    );

    rveaMosa.setPopulation(
      [ind1, ind2, ind3, ind4, ind5, ind6, ind7, ind8, ind9, ind10, ind11],
      5
    );
    rveaMosa.updateObjectives(searchSubject);
    const alpha = 2;
    const progress = 0; // t/t_max
    const fr = 0.2;
    // const withCrowdingDistance = false;
    rveaMosa.environmentalSelection(6, alpha, progress, fr);

    expect(rveaMosa.getPopulation().length).to.equal(6);
    expect(rveaMosa.getPopulation()).contain(ind1);
    expect(rveaMosa.getPopulation()).contain(ind2);
    expect(rveaMosa.getPopulation()).contain(ind4);
    expect(rveaMosa.getPopulation()).contain(ind5);
    expect(rveaMosa.getPopulation()).contain(ind9);
    expect(rveaMosa.getPopulation()).contain(ind11);

    const expected = [
      [5, 20],
      [31, 1],
      [7, 12],
      [13, 13],
      [10, 7],
      [24, 9],
    ];
    for (const [index, individual] of rveaMosa.getPopulation().entries()) {
      let count = 0;
      for (const objective of objectives) {
        expect(individual.getDistance(objective)).equal(expected[index][count]);
        count = count + 1;
      }
    }
  });
});
