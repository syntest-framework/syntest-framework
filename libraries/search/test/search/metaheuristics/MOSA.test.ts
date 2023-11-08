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

import { MOSAFamily } from "../../../lib/algorithms/evolutionary/MOSAFamily";
import { EncodingRunner } from "../../../lib/EncodingRunner";
import { EncodingSampler } from "../../../lib/EncodingSampler";
import { ApproachLevelCalculator } from "../../../lib/objective/heuristics/ApproachLevelCalculator";
import { UncoveredObjectiveManager } from "../../../lib/objective/managers/UncoveredObjectiveManager";
import { BranchObjectiveFunction } from "../../../lib/objective/objectiveFunctions/controlFlowBased/BranchObjectiveFunction";
import { SecondaryObjectiveComparator } from "../../../lib/objective/secondary/SecondaryObjectiveComparator";
import { Crossover } from "../../../lib/operators/crossover/Crossover";
import { DummyBranchDistanceCalculator } from "../../mocks/DummyBranchDistance.mock";
import { DummyCrossover } from "../../mocks/DummyCrossover.mock";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";
import { DummyProcreation } from "../../mocks/DummyProcreation.mock";
import { DummySearchSubject } from "../../mocks/DummySubject.mock";
import { MockedMOSA } from "../../mocks/MOSAAdapter";

const expect = chai.expect;

describe("Test MOSA", function () {
  let objectives: Set<BranchObjectiveFunction<DummyEncodingMock>>;

  beforeEach(function () {
    const branchDistance = new DummyBranchDistanceCalculator();

    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      "1",
      undefined,
      new ApproachLevelCalculator(),
      branchDistance
    );
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      "1",
      undefined,
      new ApproachLevelCalculator(),
      branchDistance
    );
    objectives = new Set<BranchObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);
    objectives.add(objective2);
  });

  it("Test Preference criterion", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([...objectives], [2, 3]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([...objectives], [0, 2]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([...objectives], [2, 0]);

    const mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = <Crossover<DummyEncodingMock>>{};
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );

    const mosa = new MOSAFamily(
      new UncoveredObjectiveManager(mockedRunner, [], true),
      mockedSampler,
      mockedProcreation,
      50
    );
    const frontZero = mosa.preferenceCriterion([ind1, ind2, ind3], objectives);

    expect(frontZero.length).to.equal(2);
    expect(frontZero).to.contain(ind2);
    expect(frontZero).to.contain(ind3);
  });

  it("Test Non Dominated front", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([...objectives], [2, 3]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([...objectives], [0, 2]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([...objectives], [2, 0]);

    const ind4 = new DummyEncodingMock();
    ind4.setDummyEvaluation([...objectives], [1, 1]);

    const ind5 = new DummyEncodingMock();
    ind5.setDummyEvaluation([...objectives], [5, 5]);

    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = <Crossover<DummyEncodingMock>>{};
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );

    const secondaries: SecondaryObjectiveComparator<DummyEncodingMock>[] = [];
    const mosa = new MOSAFamily(
      new UncoveredObjectiveManager(undefined, secondaries, true),
      undefined,
      mockedProcreation,
      50
    );
    const front = mosa.getNonDominatedFront(objectives, [
      ind1,
      ind2,
      ind3,
      ind4,
      ind5,
    ]);

    expect(front.length).to.equal(3);
    expect(front).to.contain(ind2);
    expect(front).to.contain(ind3);
    expect(front).to.contain(ind4);
  });

  it("Test Preference Sorting", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([...objectives], [2, 3]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([...objectives], [0, 2]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([...objectives], [2, 0]);

    const ind4 = new DummyEncodingMock();
    ind4.setDummyEvaluation([...objectives], [1, 1]);

    const mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = new DummyCrossover(0.8, 0.8);
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );

    const mosa = new MOSAFamily(
      new UncoveredObjectiveManager(mockedRunner, [], true),
      mockedSampler,
      mockedProcreation,
      4
    );
    const front = mosa.preferenceSortingAlgorithm(
      [ind1, ind2, ind3, ind4],
      objectives
    );

    expect(front[0].length).to.equal(2);
    expect(front[0]).to.contain(ind2);
    expect(front[0]).to.contain(ind3);
    expect(front[1].length).to.equal(1);
    expect(front[1]).to.contain(ind4);
    expect(front[2].length).to.equal(1);
    expect(front[2]).to.contain(ind1);
  });

  it("Environmental Selection", () => {
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
    const mosa = new MockedMOSA(
      new UncoveredObjectiveManager(mockedRunner, [], true),
      mockedSampler,
      mockedProcreation,
      50
    );

    mosa.setPopulation([ind1, ind2, ind3, ind4, ind5], 4);
    mosa.updateObjectives(searchSubject);
    mosa.environmentalSelection(4);

    expect(mosa.getPopulation().length).to.equal(4);
    expect(mosa.getPopulation()).contain(ind1);
    expect(mosa.getPopulation()).contain(ind2);
    expect(mosa.getPopulation()).contain(ind3);
    expect(mosa.getPopulation()).contain(ind4);
  });
});
