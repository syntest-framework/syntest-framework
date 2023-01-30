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

import { Crossover, Encoding } from "..";
import { CONFIG } from "../Configuration";
import { PluginManager } from "../plugin/PluginManager";

/**
 * Factory for creating an instance of a specific crossover operator from the config.
 *
 * @author Dimitri Stallenberg
 */
export function createCrossoverFromConfig<T extends Encoding>(
  pluginManager: PluginManager<T>
): Crossover<T> {
  const crossover = CONFIG.crossover;

  if (!pluginManager.crossoverOperators.has(crossover)) {
    throw new Error(
      `Specified crossover: ${crossover} not found in pluginManager.`
    );
  }

  return pluginManager.crossoverOperators
    .get(crossover)
    .createCrossoverOperator({});
}
