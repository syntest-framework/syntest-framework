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
 * Objective function for the exception criterion.
 *
 * This objective function should not be added manually to the objective manager.
 * It is added dynamically when an exception occurs on runtime.
 *
 * @author Mitchell Olsthoorn
 */
export class ExceptionObjectiveFunction<T extends Encoding>
  implements ObjectiveFunction<T>
{
  protected _subject: SearchSubject<T>;
  protected _id: string;
  protected _message: string;

  /**
   * Constructor.
   *
   * @param subject
   * @param id
   */
  constructor(subject: SearchSubject<T>, id: string, message: string) {
    this._subject = subject;
    this._id = id;
    this._message = message;
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calculateDistance(encoding: T): number {
    // This method should never be called.
    // The exception objective function is only created when an exception is already covered.
    // So the distance is always zero.
    return 0;
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
