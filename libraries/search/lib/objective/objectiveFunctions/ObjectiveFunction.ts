/*
 * Copyright 2020-2021 SynTest contributors
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

import { Encoding } from "../../Encoding";

/**
 * Function that models the objective.
 */
export abstract class ObjectiveFunction<T extends Encoding> {
  protected _id: string;
  protected _lowestDistance: number;
  protected _childObjectives: ObjectiveFunction<T>[];

  /**
   * Indicates if the distance should be shallow or deep.
   *
   * Shallow distances only return 0 (covered) or 1 (uncovered).
   * Deep distances return the actual distance.
   *
   * Shallow distances can be used to speed up the search process
   * when an objective is already covered while still improving the solution.
   */
  protected shallowDistance: boolean;

  constructor(id: string) {
    this._id = id;
    this.shallowDistance = false;
    this._lowestDistance = Number.MAX_VALUE;
    this._childObjectives = [];
  }

  /**
   * Return if the objective function is shallow (True) or deep (False).
   */
  get shallow(): boolean {
    return this.shallowDistance;
  }

  /**
   * Set the depth of the objective function.
   *
   * @param shallow True if the objective function is shallow, False otherwise.
   */
  set shallow(shallow: boolean) {
    this.shallowDistance = shallow;
  }

  /**
   * Calculate distance from the objective to an encoding.
   *
   * @param encoding Encoding
   */
  abstract calculateDistance(encoding: T): number;

  /**
   * Return the identifier of the objective.
   */
  public getIdentifier(): string {
    return this._id;
  }

  /**
   * Update the lowest distance with a new distance
   * @param distance
   */
  public updateDistance(distance: number) {
    this._lowestDistance = Math.min(distance, this._lowestDistance);
  }

  /**
   * Gets the lowest distance to this objective function
   * @returns the lowest distance encountered so far
   */
  public getLowestDistance(): number {
    return this._lowestDistance;
  }

  /**
   * Adds a child objective to the objective function
   * @param objective the child objective
   */
  public addChildObjective(objective: ObjectiveFunction<T>): void {
    this._childObjectives.push(objective);
  }

  /**
   * Gets the child objectives of this objective function
   * @returns the child objectives
   */
  public getChildObjectives(): ObjectiveFunction<T>[] {
    return this._childObjectives;
  }
}
