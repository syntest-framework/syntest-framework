/*
 * Copyright 2020-2023 SynTest contributors
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
import { DefaultProcreation, Encoding, Procreation } from "@syntest/search";

import { ProcreationOptions, ProcreationPlugin } from "../ProcreationPlugin";

/**
 * Plugin for SignalTerminationTrigger
 *
 * @author Dimitri Stallenberg
 */
export class DefaultProcreationPlugin<
  T extends Encoding
> extends ProcreationPlugin<T> {
  constructor() {
    super("default", "A default procreation operator");
  }

  createProcreationOperator(options: ProcreationOptions<T>): Procreation<T> {
    return new DefaultProcreation(
      options.crossover,
      options.mutateFunction,
      options.sampler
    );
  }

  override getOptions() {
    return new Map();
  }
}
