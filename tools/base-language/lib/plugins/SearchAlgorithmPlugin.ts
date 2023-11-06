/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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
  EncodingSampler,
  ObjectiveManager,
  Procreation,
  SearchAlgorithm,
} from "@syntest/search";

import { PluginType } from "./PluginType";

export type SearchAlgorithmOptions<T extends Encoding> = {
  objectiveManager: ObjectiveManager<T>;
  encodingSampler: EncodingSampler<T>;
  procreation: Procreation<T>;
  populationSize: number;
};

export abstract class SearchAlgorithmPlugin<T extends Encoding> extends Plugin {
  constructor(name: string, describe: string) {
    super(PluginType.SearchAlgorithm, name, describe);
  }

  abstract createSearchAlgorithm<O extends SearchAlgorithmOptions<T>>(
    options: O
  ): SearchAlgorithm<T>;

  override getOptionChoices(option: string): string[] {
    if (option === "search-algorithm") {
      return [this.name];
    }

    return [];
  }
}
