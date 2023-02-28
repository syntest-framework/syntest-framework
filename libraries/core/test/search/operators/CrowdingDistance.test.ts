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
import { crowdingDistance } from "../../../lib";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";
import { BranchObjectiveFunction, ObjectiveFunction } from "../../../lib";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */

describe("Crowding distance", function () {
  it("empty front", () => {
    crowdingDistance([], new Set<ObjectiveFunction<DummyEncodingMock>>());
  });

  it("front with one solution", () => {
    const objective = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "1",
      1,
      true
    );
    const objectives = new Set<ObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective);

    const ind = new DummyEncodingMock();
    crowdingDistance([ind], objectives);
    expect(ind.getCrowdingDistance()).to.equal(2.0);
  });

  it("front with two solutions", () => {
    const objective = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "1",
      1,
      true
    );
    const objectives = new Set<ObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective);

    const ind1 = new DummyEncodingMock();
    const ind2 = new DummyEncodingMock();

    crowdingDistance([ind1, ind2], objectives);
    expect(ind1.getCrowdingDistance()).to.equal(2.0);
    expect(ind2.getCrowdingDistance()).to.equal(2.0);
  });

  it("Front with more than two solutions", () => {
    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "1",
      1,
      true
    );
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "1",
      1,
      false
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
    expect(ind1.getCrowdingDistance()).to.equal(4.0);
    expect(ind2.getCrowdingDistance()).to.equal(4.0);
    expect(ind3.getCrowdingDistance()).to.equal(2);
  });

  it("Corner case with same obj values for all individual", () => {
    const objective1 = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "1",
      1,
      true
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
