/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { prng } from "../util/prng";
import { TestCaseDecoder } from "./decoder/TestCaseDecoder";
import { Encoding } from "../search/Encoding";
import { ExecutionResult } from "../search/ExecutionResult";
import { ObjectiveFunction } from "../search/objective/ObjectiveFunction";
import { EncodingSampler } from "../search/EncodingSampler";
import { getUserInterface } from "../ui/UserInterface";
import { ActionStatement } from "./statements/ActionStatement";

/**
 * AbstractTestCase class
 *
 * @author Annibale Panichella
 */
export abstract class AbstractTestCase implements Encoding {
  protected _root: ActionStatement;
  protected _crowdingDistance: number;
  protected _rank: number;
  protected _id: string;
  protected _assertions: Map<string, string>;

  /**
   * Mapping from objective to their distance values for this test case.
   * @protected
   */
  protected _objectives: Map<ObjectiveFunction<AbstractTestCase>, number>;

  /**
   * The last execution result of this test case.
   * @protected
   */
  protected _executionResult: ExecutionResult;

  /**
   * Constructor.
   *
   * @param root The root of the tree chromosome of the test case
   */
  constructor(root: ActionStatement) {
    this._root = root;
    this._crowdingDistance = 0;
    this._rank = 0;
    this._id = prng.uniqueId(20);
    this._objectives = new Map<ObjectiveFunction<AbstractTestCase>, number>();
    this._assertions = new Map();
    getUserInterface().debug(`Created test case: ${this._id}`);
  }

  abstract mutate(sampler: EncodingSampler<AbstractTestCase>): AbstractTestCase;

  abstract hashCode(decoder: TestCaseDecoder): number;

  getCrowdingDistance(): number {
    return this._crowdingDistance;
  }

  setCrowdingDistance(value: number): void {
    this._crowdingDistance = value;
  }

  getRank(): number {
    return this._rank;
  }

  setRank(value: number): void {
    this._rank = value;
  }

  get id(): string {
    return this._id;
  }
  get root(): ActionStatement {
    return this._root;
  }

  get assertions(): Map<string, string> {
    return this._assertions;
  }

  set assertions(value: Map<string, string>) {
    this._assertions = value;
  }

  abstract copy(): AbstractTestCase;

  getExecutionResult(): ExecutionResult {
    return this._executionResult;
  }

  setExecutionResult(executionResult: ExecutionResult): void {
    this._executionResult = executionResult;
  }

  /**
   * Return the distance for the given objective.
   *
   * @param objectiveFunction The objective.
   */
  getDistance(objectiveFunction: ObjectiveFunction<AbstractTestCase>): number {
    if (this._objectives.has(objectiveFunction))
      return this._objectives.get(objectiveFunction);
    else {
      // this part is needed for DynaMOSA
      // it may happen that the test was created when the objective in input was not part of the search yet
      // with this code, we keep the objective values up to date
      const distance = objectiveFunction.calculateDistance(this);
      this._objectives.set(objectiveFunction, distance);
      return distance;
    }
  }

  setDistance(
    objectiveFunction: ObjectiveFunction<Encoding>,
    distance: number
  ): void {
    this._objectives.set(objectiveFunction, distance);
  }

  abstract getLength(): number;
}
