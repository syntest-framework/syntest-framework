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
 * Dynamic Many-Objective Sorting Algorithm (DynaMOSA).
 *
 * Based on:
 * Automated Test Case Generation as a Many-Objective Optimisation Problem with Dynamic Selection of the Targets
 * A. Panichella; F. K. Kifetew; P. Tonella
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 */
export class DynaMOSAProbPreset extends Preset {
  constructor() {
    super("DynaMOSA-prob", "DynaMOSA preset");
  }

  modifyArgs<T>(arguments_: ArgumentsCamelCase<T>): void {
    (<ArgumentsObject>(<unknown>arguments_)).searchAlgorithm = "MOSAFamily";
    (<ArgumentsObject>(<unknown>arguments_)).objectiveManager =
      "structural-uncovered";
    (<ArgumentsObject>(<unknown>arguments_)).procreation = "default";
    (<ArgumentsObject>(<unknown>arguments_)).secondaryObjectives = ["length"];
    (<ArgumentsObject>(<unknown>arguments_)).populationSize = 50;

    if ("typePool" in arguments_) {
      (<{ typePool: boolean }>(<unknown>arguments_)).typePool = false;
    }

    if ("incorporateExecutionInformation" in arguments_) {
      (<{ incorporateExecutionInformation: boolean }>(
        (<unknown>arguments_)
      )).incorporateExecutionInformation = false;
    }

    if ("typeInferenceMode" in arguments_) {
      (<{ typeInferenceMode: string }>(<unknown>arguments_)).typeInferenceMode =
        "proportional";
    }
  }
}
