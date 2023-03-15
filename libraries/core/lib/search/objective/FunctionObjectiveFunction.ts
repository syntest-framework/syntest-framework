/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import { ObjectiveFunction } from "../objective/ObjectiveFunction";
import { Encoding } from "../Encoding";
import { SearchSubject } from "../SearchSubject";
import { BranchDistance } from "./calculators/BranchDistance";
import { ApproachLevel } from "./calculators/ApproachLevel";

/**
 * Objective function for the function branch criterion.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class FunctionObjectiveFunction<
  T extends Encoding
> extends ObjectiveFunction<T> {
  protected _subject: SearchSubject<T>;
  protected _id: string;
  protected _line: number;

  /**
   * Constructor.
   *
   * @param subject
   * @param id
   * @param line
   */
  constructor(
    approachLevel: ApproachLevel,
    branchDistance: BranchDistance,
    subject: SearchSubject<T>,
    id: string,
    line: number
  ) {
    super(approachLevel, branchDistance);
    this._subject = subject;
    this._id = id;
    this._line = line;
  }

  /**
   * @inheritDoc
   */
  calculateDistance(encoding: T): number {
    if (encoding.getExecutionResult() === undefined) {
      return Number.MAX_VALUE;
    }

    if (encoding.getExecutionResult().coversId(this._id)) {
      return 0;
    } else {
      return 1;
    }
  }

  /**
   * @inheritDoc
   */
  getIdentifier(): string {
    return this._id;
  }

  /**
   * @inheritDoc
   */
  getSubject(): SearchSubject<T> {
    return this._subject;
  }
}
