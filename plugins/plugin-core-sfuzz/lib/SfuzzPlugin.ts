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

import {
  Encoding,
  SearchAlgorithmPlugin,
  SearchAlgorithm,
  SearchAlgorithmOptions,
  PluginManager,
} from "@syntest/core";
import { Sfuzz } from "./Sfuzz";
import { SfuzzObjectiveManager } from "./SfuzzObjectiveManager";
import { pluginRequiresOptions } from "@syntest/core/lib/Diagnostics";

/**
 * This example plugin logs the program state at the start of the initialization phase of the program.
 *
 * @author Dimitri Stallenberg
 */
export default class SfuzzPlugin<T extends Encoding>
  implements SearchAlgorithmPlugin<T>
{
  name = "Sfuzz";

  register(pluginManager: PluginManager<T>) {
    pluginManager.registerSearchAlgorithm(this);
  }

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    if (!options.eventManager) {
      throw new Error(pluginRequiresOptions("Sfuzz", "eventManager"));
    }
    if (!options.encodingSampler) {
      throw new Error(pluginRequiresOptions("Sfuzz", "encodingSampler"));
    }
    if (!options.runner) {
      throw new Error(pluginRequiresOptions("Sfuzz", "runner"));
    }
    if (!options.crossover) {
      throw new Error(pluginRequiresOptions("Sfuzz", "crossover"));
    }
    return new Sfuzz<T>(
      options.eventManager,
      new SfuzzObjectiveManager<T>(options.runner),
      options.encodingSampler,
      options.crossover
    );
  }
}
