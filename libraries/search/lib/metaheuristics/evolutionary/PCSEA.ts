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

import { Encoding } from "../../Encoding";
import { cornerSort } from "../../operators/ranking/CornerRanking";

import { EvolutionaryAlgorithm } from "./EvolutionaryAlgorithm";

/**
 * Pareto Corner Search Evolutionary Algorithm (PCSEA), adapted for test case generation.
 *
 * Implementation is based on:
 * "A Pareto Corner Search Evolutionary Algorithm and Dimensionality Reduction in Many-Objective
 * Optimization Problems" by H. K. Singh; A. Isaacs; T. Ray
 */
export class PCSEA<T extends Encoding> extends EvolutionaryAlgorithm<T> {
  /**
   * @inheritDoc
   * @protected
   */
  protected _environmentalSelection(size: number): void {
    if (this._objectiveManager.getCurrentObjectives().size === 0) {
      return;
    }

    this._population = cornerSort(
      this._population,
      this._objectiveManager.getCurrentObjectives(),
      size
    );
  }
}
