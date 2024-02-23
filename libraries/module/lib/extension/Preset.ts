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
import { getLogger, Logger } from "@syntest/logging";
import Yargs = require("yargs");

import { Extension } from "./Extension";

export abstract class Preset extends Extension {
  protected static LOGGER: Logger;
  public describe: Readonly<string>;

  constructor(name: string, describe: string) {
    super(name);
    Preset.LOGGER = getLogger(Preset.name);
    this.describe = describe;
  }

  modifyArgs<T>(arguments_: Yargs.ArgumentsCamelCase<T>) {
    const configuration = this.getPresetConfiguration();

    for (const key of Object.keys(configuration)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      if ((<any>arguments_)[key] !== configuration[key]) {
        Preset.LOGGER.warn(
          `Overriding option with key: "${key}" based on preset ${this.name}`,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      (<any>arguments_)[key] = configuration[key];
    }
  }

  abstract getPresetConfiguration(): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}
