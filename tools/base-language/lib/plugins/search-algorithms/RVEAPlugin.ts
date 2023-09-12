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
import { Encoding, RVEA, SearchAlgorithm } from "@syntest/search";

import {
  SearchAlgorithmOptions,
  SearchAlgorithmPlugin,
} from "../SearchAlgorithmPlugin";

/**
 * Plugin for RVEA Algorithm
 *
 * Based on:
 * A Reference Vector Guided Evolutionary Algorithm for Many-Objective Optimization
 * R. Cheng; Y. Jin; M. Olhofer; B. Sendhoff
 *
 */
export class RVEAPlugin<T extends Encoding> extends SearchAlgorithmPlugin<T> {
  constructor() {
    super("RVEA", "Reference Vector Guided Evolutionary Algorithm");
  }

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    return new RVEA<T>(
      options.objectiveManager,
      options.encodingSampler,
      options.procreation,
      options.populationSize
    );
  }

  override getOptions() {
    return new Map();
  }
}
