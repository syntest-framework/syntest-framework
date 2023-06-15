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
import { RVEA } from "../../../lib/metaheuristics/evolutionary/RVEA";
import { BranchObjectiveFunction } from "../../../lib/objective/BranchObjectiveFunction";
import { ApproachLevel } from "../../../lib/objective/heuristics/ApproachLevel";
import { UncoveredObjectiveManager } from "../../../lib/objective/managers/UncoveredObjectiveManager";
import { Crossover } from "../../../lib/operators/crossover/Crossover";
import { DummyBranchDistance } from "../../mocks/DummyBranchDistance.mock";
import { DummyCrossover } from "../../mocks/DummyCrossover.mock";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";
import { DummyProcreation } from "../../mocks/DummyProcreation.mock";
import { DummySearchSubject } from "../../mocks/DummySubject.mock";
import { MockedRVEA } from "../../mocks/RVEAAdapter";

describe("Test RVEA", function () {
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

  it("Test Reference Point Generation", () => {
    const mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = <Crossover<DummyEncodingMock>>{};
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );

    const rvea = new RVEA(
      new UncoveredObjectiveManager(mockedRunner, new Set()),
      mockedSampler,
      mockedProcreation,
      5
    );

    const referencePoints = rvea.referencePoints(objectives.size, 5);
    const expected = [
      [0, 1],
      [0.2, 0.8],
      [0.4, 0.6],
      [0.6, 0.4],
      [0.8, 0.2],
      [1, 0],
    ];

    expect(referencePoints.length).to.equal(6);
    expect(referencePoints[0].length).to.equal(2);

    for (const [index, points] of referencePoints.entries()) {
      const point = expected[index];
      for (const [index_2, number] of points.entries()) {
        expect(number).to.equal(
          point[index_2],
          "The coordinates are incorrect."
        );
      }
    }
  });

  it("Test Reference Vector Generation", () => {
    const mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = <Crossover<DummyEncodingMock>>{};
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );

    const rvea = new RVEA(
      new UncoveredObjectiveManager(mockedRunner, new Set()),
      mockedSampler,
      mockedProcreation,
      5
    );

    const referencePoints = [
      [0, 1],
      [0.2, 0.8],
      [0.4, 0.6],
      [0.6, 0.4],
      [0.8, 0.2],
      [1, 0],
    ];
    const expected = [
      [0, 1],
      [0.2425, 0.9701],
      [0.5547, 0.8321],
      [0.8321, 0.5547],
      [0.9701, 0.2425],
      [1, 0],
    ];
    // const expected = [[0, 0.4767], [0.0953, 0.3814], [0.1907, 0.286], [0.286, 0.1907], [0.3814, 0.0953], [0.4767, 0]];
    const referenceVectors = rvea.referenceVectors(referencePoints);

    expect(referenceVectors.length).to.equal(referencePoints.length);
    expect(referenceVectors[0].length).to.equal(referencePoints[0].length);

    for (const [index, points] of referenceVectors.entries()) {
      const point = expected[index];
      for (const [index_2, number] of points.entries()) {
        expect(number.toFixed(4)).to.equal(
          point[index_2].toFixed(4),
          "The reference vector coordinates are incorrect."
        );
      }
    }
  });

  it("Test Objective Value Translation", () => {
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

    const searchSubject = new DummySearchSubject([...objectives]);

    const mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = new DummyCrossover(0.8, 0.8);
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );
    const rvea = new MockedRVEA(
      new UncoveredObjectiveManager(mockedRunner, new Set()),
      mockedSampler,
      mockedProcreation,
      5
    );

    rvea.setPopulation([ind1, ind2, ind3, ind4, ind5], 4);
    rvea.updateObjectives(searchSubject);

    //TODO: Find a way to test the returned map as well.
    rvea.objectiveValueTranslation(
      rvea.getPopulation(),
      rvea.getObjectiveManager().getCurrentObjectives()
    );

    const expected = [
      [0, 13],
      [2, 5],
      [3, 11],
      [5, 0],
      [8, 6],
    ];

    expect(rvea.getPopulation().length).to.equal(5);

    for (const [index, individual] of rvea.getPopulation().entries()) {
      let count = 0;
      for (const objective of objectives) {
        expect(individual.getDistance(objective)).equal(expected[index][count]);
        count = count + 1;
      }
    }
  });

  it("Test Population Partition", () => {
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

    const searchSubject = new DummySearchSubject([...objectives]);

    const mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    const mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    const mockedCrossover = new DummyCrossover(0.8, 0.8);
    const mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );
    const rvea = new MockedRVEA(
      new UncoveredObjectiveManager(mockedRunner, new Set()),
      mockedSampler,
      mockedProcreation,
      5
    );

    rvea.setPopulation([ind1, ind2, ind3, ind4, ind5], 4);
    rvea.updateObjectives(searchSubject);

    rvea.objectiveValueTranslation(
      rvea.getPopulation(),
      rvea.getObjectiveManager().getCurrentObjectives()
    );

    const weights = [
      [0, 0.4767],
      [0.0953, 0.3814],
      [0.1907, 0.286],
      [0.286, 0.1907],
      [0.3814, 0.0953],
      [0.4767, 0],
    ];

    const { niche, arccosine, normsOfIndividuals } = rvea.populationPartition(
      rvea.getPopulation(),
      rvea.getObjectiveManager().getCurrentObjectives(),
      weights
    );

    expect(niche.size).to.equal(6);

    const expected_niche_0 = [0, 1, 2];
    expect(niche.get(0).length).to.equal(3);
    for (const [index, value] of niche.get(0).entries()) {
      expect(value).to.equal(expected_niche_0[index]);
    }

    const expected_niche_5 = [3, 4];
    expect(niche.get(5).length).to.equal(2);
    for (const [index, value] of niche.get(5).entries()) {
      expect(value).to.equal(expected_niche_5[index]);
    }

    //TODO: Improve arccosine test?
    expect(arccosine.length).to.equal(5);

    const expected_individual_norm = [13, 5.3852, 11.4018, 5, 10];
    for (const [index, value] of expected_individual_norm.entries()) {
      expect(value.toFixed(4)).to.equal(normsOfIndividuals[index].toFixed(4));
    }
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
    const rvea = new MockedRVEA(
      new UncoveredObjectiveManager(mockedRunner, new Set()),
      mockedSampler,
      mockedProcreation,
      5
    );

    rvea.setPopulation([ind1, ind2, ind3, ind4, ind5], 4);
    rvea.updateObjectives(searchSubject);
    const alpha = 2;
    const progress = 0; // t/t_max
    const fr = 0.2;
    rvea.environmentalSelection(5, alpha, progress, fr);

    expect(rvea.getPopulation().length).to.equal(4);
    expect(rvea.getPopulation()).contain(ind2);
    expect(rvea.getPopulation()).contain(ind3);
    expect(rvea.getPopulation()).contain(ind4);
    expect(rvea.getPopulation()).contain(ind5);

    const expected = [
      [0, 2],
      [1, 1],
      [3, 2],
      [2, 0],
    ];
    for (const [index, individual] of rvea.getPopulation().entries()) {
      let count = 0;
      for (const objective of objectives) {
        expect(individual.getDistance(objective)).equal(expected[index][count]);
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
    const rvea = new MockedRVEA(
      new UncoveredObjectiveManager(mockedRunner, new Set()),
      mockedSampler,
      mockedProcreation,
      5
    );

    rvea.setPopulation(
      [ind1, ind2, ind3, ind4, ind5, ind6, ind7, ind8, ind9, ind10, ind11],
      5
    );
    rvea.updateObjectives(searchSubject);
    const alpha = 2;
    const progress = 0; // t/t_max
    const fr = 0.2;
    rvea.environmentalSelection(5, alpha, progress, fr);

    //TODO: Should I limit the size of the population because RVEA does not usually.

    expect(rvea.getPopulation().length).to.equal(6);
    expect(rvea.getPopulation()).contain(ind1);
    expect(rvea.getPopulation()).contain(ind2);
    expect(rvea.getPopulation()).contain(ind4);
    expect(rvea.getPopulation()).contain(ind10);
    expect(rvea.getPopulation()).contain(ind7);
    expect(rvea.getPopulation()).contain(ind11);

    const expected = [
      [5, 20],
      [7, 12],
      [10, 7],
      [27, 16],
      [18, 4],
      [31, 1],
    ];
    for (const [index, individual] of rvea.getPopulation().entries()) {
      let count = 0;
      for (const objective of objectives) {
        expect(individual.getDistance(objective)).equal(expected[index][count]);
        count = count + 1;
      }
    }
  });
});
