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

import { SearchAlgorithm } from "./SearchAlgorithm";
import { Encoding } from "../Encoding";
import { EncodingSampler } from "../EncodingSampler";
import { SimpleObjectiveManager } from "../objective/managers/SimpleObjectiveManager";
import { BudgetManager } from "../budget/BudgetManager";
import { TerminationManager } from "../termination/TerminationManager";
import {
  SearchAlgorithmPlugin,
  SearchAlgorithmOptions,
} from "../../plugin/SearchAlgorithmPlugin";
import { ObjectiveManager } from "../objective/managers/ObjectiveManager";
import { PluginManager } from "../../plugin/PluginManager";

/**
 * Random Search algorithm that adds new encodings when these explore a new area of the search domain.
 *
 * @author Mitchell Olsthoorn
 */
export class RandomSearch<T extends Encoding> extends SearchAlgorithm<T> {
  protected _encodingSampler: EncodingSampler<T>;

  /**
   * Constructor.
   *
   * @param encodingSampler The encoding sampler
   * @param runner The encoding execution runner
   */
  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>
  ) {
    super(objectiveManager);
    this._encodingSampler = encodingSampler;
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected _initialize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    budgetManager: BudgetManager<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    terminationManager: TerminationManager
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}

  /**
   * @inheritDoc
   * @protected
   */
  protected async _iterate(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Promise<void> {
    // Sample a new random encoding
    const randomEncoding: T = this._encodingSampler.sample();

    // Evaluate the new encoding
    await this._objectiveManager.evaluateOne(
      randomEncoding,
      budgetManager,
      terminationManager
    );
  }
}

/**
 * Factory plugin for RandomSearch
 *
 * @author Dimitri Stallenberg
 */
export class RandomSearchFactory<T extends Encoding>
  implements SearchAlgorithmPlugin<T>
{
  name = "RandomSearch";

  // This function is not implemented since it is an internal plugin
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  register() {}

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    if (!options.encodingSampler) {
      throw new Error("RandomSearch requires encodingSampler option.");
    }
    if (!options.runner) {
      throw new Error("RandomSearch requires runner option.");
    }
    return new RandomSearch(
      new SimpleObjectiveManager<T>(options.runner),
      options.encodingSampler
    );
  }
}
