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
  SearchAlgorithm,
  NSGAII,
  SimpleObjectiveManager,
} from "@syntest/core";
import { pluginRequiresOptions } from "@syntest/cli";
import {
  SearchAlgorithmPlugin,
  SearchAlgorithmOptions,
} from "../../plugin/SearchAlgorithmPlugin";

/**
 * Factory plugin for NSGAII
 *
 * @author Dimitri Stallenberg
 */
export class NSGAIIFactory<T extends Encoding>
  implements SearchAlgorithmPlugin<T>
{
  name = "NSGAII";
  type: "Search Algorithm";

  // This function is not implemented since it is an internal plugin
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  register() {}

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    if (!options.eventManager) {
      throw new Error(pluginRequiresOptions("NSGAII", "eventManager"));
    }
    if (!options.encodingSampler) {
      throw new Error(pluginRequiresOptions("NSGAII", "encodingSampler"));
    }
    if (!options.runner) {
      throw new Error(pluginRequiresOptions("NSGAII", "runner"));
    }
    if (!options.crossover) {
      throw new Error(pluginRequiresOptions("NSGAII", "crossover"));
    }
    if (!options.populationSize) {
      throw new Error(pluginRequiresOptions("DynaMOSA", "populationSize"));
    }
    if (!options.crossoverProbability) {
      throw new Error(
        pluginRequiresOptions("DynaMOSA", "crossoverProbability")
      );
    }
    return new NSGAII<T>(
      options.eventManager,
      new SimpleObjectiveManager<T>(options.runner),
      options.encodingSampler,
      options.crossover,
      options.populationSize,
      options.crossoverProbability
    );
  }
}
