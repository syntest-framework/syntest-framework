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
import { Preset } from "@syntest/module";
import { ArgumentsCamelCase } from "yargs";

import { ArgumentsObject } from "../Configuration";

/**
 * Many-objective Sorting Algorithm (MOSA).
 *
 * Based on:
 * Reformulating Branch Coverage as a Many-Objective Optimization Problem
 * A. Panichella; F. K. Kifetew; P. Tonella
 *
 * @author Diego Viero
 */
export class PSOPreset extends Preset {
  constructor() {
    super("PSO", "PSO preset");
  }

  modifyArgs<T>(arguments_: ArgumentsCamelCase<T>): void {
    (<ArgumentsObject>(<unknown>arguments_)).searchAlgorithm = "PSO";
    (<ArgumentsObject>(<unknown>arguments_)).objectiveManager = "simple";
    (<ArgumentsObject>(<unknown>arguments_)).procreation = "default";
    (<ArgumentsObject>(<unknown>arguments_)).populationSize = 50;
  }
}
