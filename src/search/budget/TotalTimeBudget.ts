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

import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchTimeBudget } from "./SearchTimeBudget";

/**
 * Budget for the total time of the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class TotalTimeBudget<T extends Encoding>
  extends SearchTimeBudget<T>
  implements Budget<T>
{
  /**
   * @inheritDoc
   */
  initializationStarted(): void {
    this.searchStarted();
  }

  /**
   * @inheritDoc
   */
  initializationStopped(): void {
    this.searchStopped();
  }
}
