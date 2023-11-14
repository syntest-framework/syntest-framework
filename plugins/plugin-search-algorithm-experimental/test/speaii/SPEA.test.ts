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
import {
  ApproachLevelCalculator,
  BranchObjectiveFunction,
  EncodingRunner,
  EncodingSampler,
  SimpleObjectiveManager,
  UncoveredObjectiveManager,
} from "@syntest/search";
import * as chai from "chai";

import { DummyBranchDistance } from "../mocks/DummyBranchDistance.mock";
import { DummyCrossover } from "../mocks/DummyCrossover.mock";
import { DummyEncodingMock } from "../mocks/DummyEncoding.mock";
import { DummyProcreation } from "../mocks/DummyProcreation.mock";
import { DummySearchSubject } from "../mocks/DummySubject.mock";

import { MockedDynaSPEAII, MockedSPEAII } from "./SPEAIIAdapter.mock";

const expect = chai.expect;

describe("Test SPEA-II", function () {
  let objectives: Set<BranchObjectiveFunction<DummyEncodingMock>>;
  let searchSubject: DummySearchSubject<DummyEncodingMock>;
  let mockedRunner: EncodingRunner<DummyEncodingMock>;
  let mockedSampler: EncodingSampler<DummyEncodingMock>;
  let mockedCrossover: DummyCrossover;
  let mockedProcreation: DummyProcreation<DummyEncodingMock>;
  let spea: MockedSPEAII<DummyEncodingMock>;
  let dynaSpea: MockedDynaSPEAII<DummyEncodingMock>;

  let ind1: DummyEncodingMock;
  let ind2: DummyEncodingMock;
  let ind3: DummyEncodingMock;
  let ind4: DummyEncodingMock;
  let ind5: DummyEncodingMock;

  beforeEach(function () {
    const branchDistance = new DummyBranchDistance();

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

    searchSubject = new DummySearchSubject([...objectives]);
    mockedRunner = <EncodingRunner<DummyEncodingMock>>{};
    mockedSampler = <EncodingSampler<DummyEncodingMock>>{};
    mockedCrossover = new DummyCrossover(0.8, 0.8);
    mockedProcreation = new DummyProcreation(
      mockedCrossover,
      (sampler, encoding) => encoding.mutate(),
      mockedSampler
    );
    spea = new MockedSPEAII(
      new SimpleObjectiveManager(mockedRunner, [], true),
      mockedSampler,
      mockedProcreation,
      50,
      3
    );

    dynaSpea = new MockedDynaSPEAII(
      new UncoveredObjectiveManager(mockedRunner, [], true),
      mockedSampler,
      mockedProcreation,
      50,
      3
    );

    ind1 = new DummyEncodingMock();
    ind2 = new DummyEncodingMock();
    ind3 = new DummyEncodingMock();
    ind4 = new DummyEncodingMock();
    ind5 = new DummyEncodingMock();
  });

  it("Environmental Selection, non-dominated = size", () => {
    ind1.setDummyEvaluation([...objectives], [2, 2]);

    ind2.setDummyEvaluation([...objectives], [0, 2]);

    ind3.setDummyEvaluation([...objectives], [2, 0]);

    ind4.setDummyEvaluation([...objectives], [1, 1]);

    ind5.setDummyEvaluation([...objectives], [3, 2]);

    spea.setPopulation([ind1, ind2, ind3, ind4, ind5], 5);
    spea.updateObjectives(searchSubject);
    spea.environmentalSelection(3);

    expect(spea.getPopulation().length).to.equal(3);
    expect(spea.getPopulation()).contain(ind2);
    expect(spea.getPopulation()).contain(ind3);
    expect(spea.getPopulation()).contain(ind4);
  });

  it("Environmental Selection dynaSpea, non-dominated = size", () => {
    ind1.setDummyEvaluation([...objectives], [2, 2]);

    ind2.setDummyEvaluation([...objectives], [0, 2]);

    ind3.setDummyEvaluation([...objectives], [2, 0]);

    ind4.setDummyEvaluation([...objectives], [1, 1]);

    ind5.setDummyEvaluation([...objectives], [3, 2]);

    dynaSpea.setPopulation([ind1, ind2, ind3, ind4, ind5], 5);
    dynaSpea.updateObjectives(searchSubject);
    dynaSpea.environmentalSelection(3);

    const frontZero = dynaSpea.preferenceCriterion(
      [ind1, ind2, ind3, ind4, ind5],
      objectives
    );
    expect(frontZero.length).to.equal(2);
    expect(frontZero).to.contain(ind2);
    expect(frontZero).to.contain(ind3);

    expect(dynaSpea.getPopulation().length).to.equal(3);
    expect(dynaSpea.getPopulation()).contain(ind2);
    expect(dynaSpea.getPopulation()).contain(ind3);
    expect(dynaSpea.getPopulation()).contain(ind4);
  });
  it("Environmental Selection, non-dominated < size", () => {
    ind1.setDummyEvaluation([...objectives], [2, 2]);

    ind2.setDummyEvaluation([...objectives], [0, 2]);

    ind3.setDummyEvaluation([...objectives], [2, 0]);

    ind4.setDummyEvaluation([...objectives], [1, 2]);

    ind5.setDummyEvaluation([...objectives], [0, 0]);

    spea.setPopulation([ind1, ind2, ind3, ind4, ind5], 4);
    spea.updateObjectives(searchSubject);
    spea.environmentalSelection(4);

    expect(spea.getPopulation().length).to.equal(3);
    expect(spea.getPopulation()).contain(ind5);
    expect(spea.getPopulation()).contain(ind2);
    expect(spea.getPopulation()).contain(ind3);
  });

  it("Environmental Selection, non-dominated > size", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([...objectives], [4, 0]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([...objectives], [0, 4]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([...objectives], [2, 1]);

    const ind4 = new DummyEncodingMock();
    ind4.setDummyEvaluation([...objectives], [1, 3]);

    const ind5 = new DummyEncodingMock();
    ind5.setDummyEvaluation([...objectives], [3, 3]);

    spea.setPopulation([ind1, ind2, ind3, ind4, ind5], 4);
    spea.updateObjectives(searchSubject);
    spea.environmentalSelection(3);

    expect(spea.getPopulation().length).to.equal(3);
    expect(spea.getPopulation()).contain(ind1);
    expect(spea.getPopulation()).contain(ind2);

    // Distance from 4 to 1 and 2 is > distance from 3 to 1 and 2. Therefore, 4 gets chosen over 3
    expect(spea.getPopulation()).contain(ind4);
  });

  it("Calculate raw fitness simple", () => {
    ind1.setDummyEvaluation([...objectives], [2, 2]);
    ind2.setDummyEvaluation([...objectives], [0, 2]);

    const solutions = [ind1, ind2];
    const rawFitness = spea.calculateRawFitness(solutions, objectives);

    expect(rawFitness.get(ind1)).to.equal(1);
    expect(rawFitness.get(ind2)).to.equal(0);
  });

  it("Calculate raw fitness", () => {
    ind1.setDummyEvaluation([...objectives], [0, 2]);
    ind2.setDummyEvaluation([...objectives], [1, 1]);
    ind3.setDummyEvaluation([...objectives], [2, 0]);
    ind4.setDummyEvaluation([...objectives], [2, 1]);
    ind5.setDummyEvaluation([...objectives], [2, 2]);

    const solutions = [ind1, ind2, ind3, ind4, ind5];
    const rawFitness = spea.calculateRawFitness(solutions, objectives);

    expect(rawFitness.get(ind1)).to.equal(0);
    expect(rawFitness.get(ind2)).to.equal(0);
    expect(rawFitness.get(ind3)).to.equal(0);
    expect(rawFitness.get(ind4)).to.equal(4);
    expect(rawFitness.get(ind5)).to.equal(6);
  });
  it("Calculate euclidean distance", () => {
    ind1.setDummyEvaluation([...objectives], [1, 1]);
    ind2.setDummyEvaluation([...objectives], [4, 5]);

    const distance = spea.euclideanDistance(ind1, ind2, objectives);

    expect(distance).to.equal(5);
  });

  it("Calculate distance matrix", () => {
    ind1.setDummyEvaluation([...objectives], [1, 1]);
    ind2.setDummyEvaluation([...objectives], [4, 5]);
    ind3.setDummyEvaluation([...objectives], [0, 0]);
    const solutions = [ind1, ind2, ind3];
    const distanceMatrix = spea.distanceMatrix(solutions, objectives);

    const expected = [
      [0, 5, Math.sqrt(2)],
      [5, 0, Math.sqrt(41)],
      [Math.sqrt(2), Math.sqrt(41), 0],
    ];
    for (const [index, element] of expected.entries()) {
      for (const [index_, element_] of element.entries()) {
        expect(distanceMatrix[index][index_]).to.be.closeTo(element_, 0.001);
      }
    }
  });

  it("Calculate fitness simple", () => {
    ind1.setDummyEvaluation([...objectives], [2, 2]);
    ind2.setDummyEvaluation([...objectives], [0, 2]);

    const solutions = [ind1, ind2];
    const fitness = spea.calculateFitness(solutions, 1, objectives);

    expect(fitness.get(ind1)).to.equal(1.25);
    expect(fitness.get(ind2)).to.equal(0.25);
  });
});
