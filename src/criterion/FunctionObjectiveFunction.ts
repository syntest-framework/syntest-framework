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

import { ObjectiveFunction } from "../search/objective/ObjectiveFunction";
import { Encoding } from "../search/Encoding";
import { SearchSubject } from "../search/SearchSubject";

/**
 * Objective function for the function branch criterion.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class FunctionObjectiveFunction<T extends Encoding>
  implements ObjectiveFunction<T>
{
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
  constructor(subject: SearchSubject<T>, id: string, line: number) {
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

    if (encoding.getExecutionResult().coversLine(this._line)) {
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
