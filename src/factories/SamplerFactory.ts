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
import { EncodingSampler } from "../search/EncodingSampler";

/**
 * Factory for creating an instance of a specific sampler from the config.
 *
 * @author Dimitri Stallenberg
 */
export function createEncodingSamplerFromConfig<T extends Encoding>(
  pluginManager: PluginManager<T>
): EncodingSampler<T> {
  const sampler = CONFIG.sampler;

  if (!pluginManager.samplers.has(sampler)) {
    throw new Error(
      `Specified sampler: ${sampler} not found in pluginManager.`
    );
  }

  return pluginManager.samplers.get(sampler).createSamplerOperator({});
}
