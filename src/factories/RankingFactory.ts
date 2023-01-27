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

import { Encoding } from "..";
import { CONFIG } from "..";
import { PluginManager } from "../plugin/PluginManager";
import { Ranking } from "../search/operators/ranking/Ranking";

/**
 * Factory for creating an instance of a specific ranking operator from the config.
 *
 * @author Dimitri Stallenberg
 */
export function createRankingOperatorFromConfig<T extends Encoding>(
  pluginManager: PluginManager<T>
): Ranking<T> {
  const ranking = CONFIG.ranking;

  if (!pluginManager.rankingPlugins.has(ranking)) {
    throw new Error(
      `Specified ranking operator: ${ranking} not found in pluginManager.`
    );
  }

  return pluginManager.rankingPlugins.get(ranking).createRankingOperator({});
}
