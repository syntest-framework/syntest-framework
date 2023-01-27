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

import { CONFIG, Encoding, TerminationManager } from "..";
import { PluginManager } from "../../src/plugin/PluginManager";

/**
 * Factory for creating an instance of a termination manager from the config.
 *
 * @author Dimitri Stallenberg
 * @author Mitchell Olsthoorn
 */
export function createTerminationManagerFromConfig<T extends Encoding>(
  pluginManager: PluginManager<T>
): TerminationManager {
  const terminationTriggers = CONFIG.terminationTriggers;

  const terminationManager = new TerminationManager();

  for (const trigger of terminationTriggers) {
    if (!pluginManager.terminationPlugins.has(trigger)) {
      throw new Error(
        `Specified trigger: ${trigger} not found in pluginManager.`
      );
    }
    terminationManager.addTrigger(
      pluginManager.terminationPlugins.get(trigger).createTerminationTrigger({})
    );
  }

  return terminationManager;
}
