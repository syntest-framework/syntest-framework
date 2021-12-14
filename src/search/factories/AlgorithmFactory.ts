/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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
  MOSA,
  NSGAII,
  Crossover,
  EncodingSampler,
  Encoding,
  EncodingRunner,
} from "../../";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";
import { RandomSearch } from "../metaheuristics/RandomSearch";
import { DynaMOSA } from "../metaheuristics/evolutionary/mosa/DynaMOSA";
import { Properties } from "../../properties";
import { Sfuzz } from "../metaheuristics/evolutionary/Sfuzz";

/**
 * Factory for creating an instance of a specific search algorithm from the config.
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export function createAlgorithmFromConfig<T extends Encoding>(
  sampler: EncodingSampler<T>,
  runner: EncodingRunner<T>,
  crossover: Crossover<T>
): SearchAlgorithm<T> {
  const algorithm = Properties.algorithm;

  switch (algorithm) {
    case "Random":
      return new RandomSearch(sampler, runner);
    case "NSGAII":
      return new NSGAII<T>(sampler, runner, crossover);
    case "MOSA":
      return new MOSA<T>(sampler, runner, crossover);
    case "DynaMOSA":
      return new DynaMOSA<T>(sampler, runner, crossover);
    case "sFuzz":
      return new Sfuzz<T>(sampler, runner, crossover);
  }
}
