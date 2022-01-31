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

import { MOSA } from "./MOSA";
import { StructuralObjectiveManager } from "../../../objective/managers/StructuralObjectiveManager";
import { EncodingSampler } from "../../../EncodingSampler";
import { EncodingRunner } from "../../../EncodingRunner";
import { Crossover } from "../../../operators/crossover/Crossover";
import { Encoding } from "../../../Encoding";

/**
 * Dynamic Many-Objective Sorting Algorithm (DynaMOSA).
 *
 * Based on:
 * Automated Test Case Generation as a Many-Objective Optimisation Problem with Dynamic Selection of the Targets
 * A. Panichella; F. K. Kifetew; P. Tonella
 *
 * @author Mitchell Olsthoorn
 */
export class DynaMOSA<T extends Encoding> extends MOSA<T> {
  constructor(
    encodingSampler: EncodingSampler<T>,
    runner: EncodingRunner<T>,
    crossover: Crossover<T>
  ) {
    super(encodingSampler, runner, crossover);
    this._objectiveManager = new StructuralObjectiveManager<T>(runner);
  }
}
