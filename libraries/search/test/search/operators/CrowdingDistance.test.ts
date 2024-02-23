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

import { BranchObjectiveFunction } from "../../../lib/objective/branch/BranchObjectiveFunction";
import { ApproachLevelCalculator } from "../../../lib/objective/heuristics/ApproachLevelCalculator";
import { ObjectiveFunction } from "../../../lib/objective/ObjectiveFunction";
import { crowdingDistance } from "../../../lib/operators/ranking/CrowdingDistance";
import { DummyBranchDistanceCalculator } from "../../mocks/DummyBranchDistance.mock";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";

const expect = chai.expect;

describe("Crowding distance", function () {
  it("empty front", () => {
    crowdingDistance([], new Set<ObjectiveFunction<DummyEncodingMock>>());
  });

  it("front with one solution", () => {
    const objective = new BranchObjectiveFunction<DummyEncodingMock>(
      "1",
      undefined,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator(),
    );
    const objectives = new Set<ObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective);

    const ind = new DummyEncodingMock();
    crowdingDistance([ind], objectives);
    expect(ind.getCrowdingDistance()).to.equal(2);
  });

  it("front with two solutions", () => {
    const objective = new BranchObjectiveFunction<DummyEncodingMock>(
      "1",
      undefined,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator(),
    );
    const objectives = new Set<ObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective);

    const ind1 = new DummyEncodingMock();
    const ind2 = new DummyEncodingMock();

    crowdingDistance([ind1, ind2], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(2);
    expect(ind2.getCrowdingDistance()).to.equal(2);
  });

  it("Front with more than two solutions", () => {
    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      "1",
      undefined,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator(),
    );
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      "1",
      undefined,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator(),
    );
    const objectives = new Set<ObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);
    objectives.add(objective2);

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([objective1, objective2], [0, 2]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([objective1, objective2], [2, 0]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([objective1, objective2], [1, 1]);

    crowdingDistance([ind1, ind2, ind3], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(4);
    expect(ind2.getCrowdingDistance()).to.equal(4);
    expect(ind3.getCrowdingDistance()).to.equal(2);
  });

  it("Corner case with same obj values for all individual", () => {
    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      "1",
      undefined,
      new ApproachLevelCalculator(),
      new DummyBranchDistanceCalculator(),
    );
    const objectives = new Set<ObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([objective1], [1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([objective1], [1]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([objective1], [1]);

    crowdingDistance([ind1, ind2, ind3], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(0);
    expect(ind2.getCrowdingDistance()).to.equal(0);
    expect(ind3.getCrowdingDistance()).to.equal(0);
  });
});
