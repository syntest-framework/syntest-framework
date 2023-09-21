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
import { Encoding } from "../../Encoding";

import { SecondaryObjectiveComparator } from "./SecondaryObjectiveComparator";

/**
 * Secondary objective that is based on the length of the encoding.
 */
export class SmallestLengthObjectiveComparator<T extends Encoding>
  implements SecondaryObjectiveComparator<T>
{
  /**
   * @inheritDoc
   */
  public compare(a: T, b: T): number {
    if (a.getLength() > b.getLength()) return -1; // a is longer so b is better
    if (a.getLength() < b.getLength()) return 1; // a is smaller so a is better

    // Length must be equal
    return 0;
  }
}
