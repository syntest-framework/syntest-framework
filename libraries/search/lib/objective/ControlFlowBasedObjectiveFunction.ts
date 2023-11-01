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

import { Encoding } from "../Encoding";
import { SearchSubject } from "../SearchSubject";

import { ApproachLevel } from "./heuristics/ApproachLevel";
import { BranchDistance } from "./heuristics/BranchDistance";
import { ObjectiveFunction } from "./ObjectiveFunction";

/**
 * Objective function based on control flow graph calculations.
 *
 * @author Dimitri Stallenberg
 */
export abstract class ControlFlowBasedObjectiveFunction<
  T extends Encoding
> extends ObjectiveFunction<T> {
  protected approachLevel: ApproachLevel;
  protected branchDistance: BranchDistance;

  constructor(
    id: string,
    subject: SearchSubject<T>,
    approachLevel: ApproachLevel,
    branchDistance: BranchDistance
  ) {
    super(id, subject);
    this.approachLevel = approachLevel;
    this.branchDistance = branchDistance;
  }
}
