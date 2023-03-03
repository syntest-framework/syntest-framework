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
import {
  Encoding,
  RandomSearch,
  SearchAlgorithm,
  SimpleObjectiveManager,
} from "@syntest/core";
import { pluginRequiresOptions } from "@syntest/module";

import {
  SearchAlgorithmOptions,
  SearchAlgorithmPlugin,
} from "../SearchAlgorithmPlugin";

/**
 * Plugin for RandomSearch
 *
 * @author Dimitri Stallenberg
 */
export class RandomSearchPlugin<
  T extends Encoding
> extends SearchAlgorithmPlugin<T> {
  constructor() {
    super("Random", "Random search algorithm");
  }

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    if (!options.encodingSampler) {
      throw new Error(pluginRequiresOptions("RandomSearch", "encodingSampler"));
    }
    if (!options.runner) {
      throw new Error(pluginRequiresOptions("RandomSearch", "runner"));
    }
    return new RandomSearch(
      new SimpleObjectiveManager<T>(options.runner),
      options.encodingSampler
    );
  }
}
