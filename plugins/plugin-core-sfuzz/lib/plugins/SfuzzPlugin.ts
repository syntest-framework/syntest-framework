/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core Sfuzz Plugin.
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

import { Encoding, SearchAlgorithm } from "@syntest/core";
import { Sfuzz } from "../Sfuzz";
import {
  SearchAlgorithmPlugin,
  SearchAlgorithmOptions,
} from "@syntest/base-testing-tool";

/**
 * Plugin for the Sfuzz search algorithm.
 *
 * @author Dimitri Stallenberg
 */
export class SfuzzPlugin<T extends Encoding> extends SearchAlgorithmPlugin<T> {
  constructor() {
    super("Sfuzz", "Sfuzz search algorithm");
  }

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    return new Sfuzz<T>(
      options.objectiveManager,
      options.encodingSampler,
      options.offspring,
      options.populationSize
    );
  }
}
