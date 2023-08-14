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
  SearchAlgorithmOptions,
  SearchAlgorithmPlugin,
} from "@syntest/base-language";
import { Encoding, SearchAlgorithm } from "@syntest/search";
import Yargs = require("yargs");

import { DynaSPEA2 } from "../algorithms/DynaSPEA2";

export class DynaSPEA2Plugin<
  T extends Encoding
> extends SearchAlgorithmPlugin<T> {
  constructor() {
    super("DynaSPEA2", "DynaSPEA2 search algorithm");
  }

  createSearchAlgorithm(
    options: SearchAlgorithmOptions<T>
  ): SearchAlgorithm<T> {
    return new DynaSPEA2<T>(
      options.objectiveManager,
      options.encodingSampler,
      options.procreation,
      options.populationSize,
      options.populationSize,
      (<AlgorithmOptions>(<unknown>this.args)).DynaSPEA2Strategy
    );
  }

  override getOptions(): Map<string, Yargs.Options> {
    // any tool can use this listener
    // any label can use this listener

    const map = new Map<string, Yargs.Options>();

    map.set("strategy", {
      alias: [],
      default: 1,
      description: "The strategy of SPEA2",
      group: "Search Algorithm Options",
      hidden: false,
      normalize: true,
      type: "number",
    });

    return map;
  }
}

export type AlgorithmOptions = {
  DynaSPEA2Strategy: number;
};
