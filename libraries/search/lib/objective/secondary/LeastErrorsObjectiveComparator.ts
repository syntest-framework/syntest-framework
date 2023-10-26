/*
 * Copyright 2020-2023 SynTest contributors
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
import { Encoding } from "../../Encoding";

import { SecondaryObjectiveComparator } from "./SecondaryObjectiveComparator";

/**
 * Secondary objective that is based on wether the encoding introduces an error .
 */
export class LeastErrorsObjectiveComparator<T extends Encoding>
  implements SecondaryObjectiveComparator<T>
{
  /**
   * @inheritDoc
   */
  public compare(a: T, b: T): number {
    if (!a.getExecutionResult() || !b.getExecutionResult()) {
      // one or both of the encodings do not have an execution result
      return 0;
    }

    if (
      a.getExecutionResult().hasError() &&
      b.getExecutionResult().hasError()
    ) {
      return 0; // both throw an error
    } else if (a.getExecutionResult().hasError()) {
      return -1; // a throws an error but b does not so b is better
    } else if (b.getExecutionResult().hasError()) {
      return 1; // b throws an error but a does not so a is better
    }

    // neither throws an error
    return 0;
  }
}
