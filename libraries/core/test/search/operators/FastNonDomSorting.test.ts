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
import { fastNonDomSorting } from "../../../lib/operators/ranking/FastNonDomSorting";
import { DummyBranchDistance } from "../../mocks/DummyBranchDistance.mock";
import { DummyEncodingMock } from "../../mocks/DummyEncoding.mock";

const expect = chai.expect;

/**
 * @author Annibale Panichella
 */
describe("Fast non-dominated sorting", function () {
  it("Sort three solutions", () => {
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
    const objectives = new Set<BranchObjectiveFunction<DummyEncodingMock>>();
    objectives.add(objective1);
    objectives.add(objective2);

    const ind1 = new DummyEncodingMock();
    ind1.setDummyEvaluation([objective1, objective2], [0, 1]);

    const ind2 = new DummyEncodingMock();
    ind2.setDummyEvaluation([objective1, objective2], [3, 3]);

    const ind3 = new DummyEncodingMock();
    ind3.setDummyEvaluation([objective1, objective2], [2, 0]);

    const F = fastNonDomSorting([ind1, ind2, ind3], objectives);
    expect(F[0].length).to.equal(2);
    expect(F[0]).to.contain(ind1);
    expect(F[0]).to.contain(ind3);
    expect(F[1].length).to.equal(1);
    expect(F[1]).to.contain(ind2);
  });
});
