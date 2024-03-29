/*
 * Copyright 2020-2023 SynTest contributors
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
import { Preset } from "@syntest/module";

/**
 * Many-objective Sorting Algorithm (MOSA).
 *
 * Based on:
 * Reformulating Branch Coverage as a Many-Objective Optimization Problem
 * A. Panichella; F. K. Kifetew; P. Tonella
 */
export class MOSAPreset extends Preset {
  constructor() {
    super("MOSA", "MOSA preset");
  }

  getPresetConfiguration() {
    return {
      searchAlgorithm: "MOSAFamily",
      objectiveManager: "uncovered",
      procreation: "default",
      populationSize: 50,
      secondaryObjectives: ["least-errors", "smallest-encoding"],
    };
  }
}
