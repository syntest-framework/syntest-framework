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
  Crossover,
  Encoding,
  EncodingSampler,
  Procreation,
} from "@syntest/core";
import { Plugin } from "@syntest/module";

import { PluginType } from "./PluginType";

export type ProcreationOptions<T extends Encoding> = {
  crossover: Crossover<T>;
  sampler: EncodingSampler<T>;
};

export abstract class ProcreationPlugin<T extends Encoding> extends Plugin {
  constructor(name: string, describe: string) {
    super(PluginType.Offspring, name, describe);
  }

  abstract createProcreationOperator<O extends ProcreationOptions<T>>(
    options: O
  ): Procreation<T>;

  getCommandOptionChoices(
    tool: string,
    labels: string[],
    command: string,
    option: string
  ): string[] {
    if (option === "procreation") {
      return [this.name];
    }

    return [];
  }
}
