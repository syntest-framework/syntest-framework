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
import { ControlFlowBasedObjectiveFunction } from "../ControlFlowBasedObjectiveFunction";

/**
 * Objective function for the branch criterion.
 */
export class BranchObjectiveFunction<
  T extends Encoding,
> extends ControlFlowBasedObjectiveFunction<T> {
  override calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();

    if (
      executionResult === undefined ||
      executionResult.getTraces().length === 0
    ) {
      return Number.MAX_VALUE;
    }

    // check if the branch is covered
    if (executionResult.coversId(this._id)) {
      return 0;
    } else if (this.shallow) {
      return Number.MAX_VALUE;
    } else {
      return this._calculateControlFlowDistance(this._id, executionResult);
    }
  }
}
