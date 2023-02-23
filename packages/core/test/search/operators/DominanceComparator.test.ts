/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core Graphing Plugin.
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
import { DominanceComparator } from "../../../lib/search/comparators/DominanceComparator";
import { BranchObjectiveFunction } from "../../../lib";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";
import { createStubInstance } from "sinon";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */
describe("Dominance comparator", function () {
  let objectives: Set<BranchObjectiveFunction<DummyEncodingMock>>;

  beforeEach(function () {
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
    objectives = new Set<BranchObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);
    objectives.add(objective2);
  });

  it("Fist individual dominates", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation(Array.from(objectives), [0, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(-1);
  });

  it("Second individual dominates", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 0]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(1);
  });

  it("None dominates with two objectives", () => {
    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation(Array.from(objectives), [1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);

    expect(value).to.equal(0);
  });

  it("None dominates with three objective", () => {
    const objective2 = new BranchObjectiveFunction<DummyEncodingMock>(
      null,
      "2",
      1,
      false
    );
    objectives.add(objective2);

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation(Array.from(objectives), [1, 0, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation(Array.from(objectives), [0, 1, 1]);

    const value = DominanceComparator.compare(ind1, ind2, objectives);
    expect(value).to.equal(0);
  });
});
