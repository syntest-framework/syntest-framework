/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import { Crossover, EncodingSampler, Encoding, EncodingRunner } from "../../";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";
import { CONFIG } from "../../Configuration";
import { PluginManager } from "../../plugin/PluginManager";
import { ObjectiveManager } from "../objective/managers/ObjectiveManager";

/**
 * Factory for creating an instance of a specific search algorithm from the config.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export function createSearchAlgorithmFromConfig<T extends Encoding>(
  pluginManager: PluginManager<T>,
  objectiveManager: ObjectiveManager<T>,
  encodingSampler: EncodingSampler<T>,
  runner: EncodingRunner<T>,
  crossover: Crossover<T>
): SearchAlgorithm<T> {
  const algorithm = CONFIG.algorithm;

  return pluginManager.searchAlgorithmPlugins
    .get(algorithm)
    .createSearchAlgorithm({
      objectiveManager,
      encodingSampler,
      runner,
      crossover,
    });
}
