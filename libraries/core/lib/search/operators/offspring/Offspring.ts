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
import { EncodingSampler } from "../../EncodingSampler";
import { Crossover } from "../crossover/Crossover";

export abstract class Offspring<E extends Encoding> {
  private _crossover: Crossover<E>;
  private _sampler: EncodingSampler<E>;

  constructor(crossover: Crossover<E>, sampler: EncodingSampler<E>) {
    this._crossover = crossover;
    this._sampler = sampler;
  }

  abstract generateOffspringPopulation(
    populationSize: number,
    population: E[]
  ): E[];

  get crossover(): Crossover<E> {
    return this._crossover;
  }

  get sampler(): EncodingSampler<E> {
    return this._sampler;
  }
}
