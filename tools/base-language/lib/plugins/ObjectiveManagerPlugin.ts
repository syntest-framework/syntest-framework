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
import { Plugin } from "@syntest/module";
import {
  Encoding,
  EncodingRunner,
  ObjectiveManager,
  SecondaryObjectiveComparator,
} from "@syntest/search";

import { PluginType } from "./PluginType";

export type ObjectiveManagerOptions<T extends Encoding> = {
  runner: EncodingRunner<T>;
  secondaryObjectives: Set<SecondaryObjectiveComparator<T>>;
  exceptionObjectivesEnabled: boolean;
};

export abstract class ObjectiveManagerPlugin<
  T extends Encoding
> extends Plugin {
  constructor(name: string, describe: string) {
    super(PluginType.ObjectiveManager, name, describe);
  }

  abstract createObjectiveManager<O extends ObjectiveManagerOptions<T>>(
    options: O
  ): ObjectiveManager<T>;

  override getOptionChoices(option: string): string[] {
    if (option === "objective-manager") {
      return [this.name];
    }

    return [];
  }
}
