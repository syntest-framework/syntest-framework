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

import { mkdirSync } from "node:fs";
import * as path from "node:path";

import { Module, ModuleManager } from "@syntest/module";

import {
  StateStorageEventListenerPlugin,
  StateStorageOptions,
} from "./StateStorageEventListenerPlugin";

export default class StateStorageModule extends Module {
  constructor() {
    super(
      // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").name,
      // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").version
    );
  }

  register(moduleManager: ModuleManager): void {
    moduleManager.registerPlugin(this, new StateStorageEventListenerPlugin());
  }

  override prepare(): void {
    const baseDirectory = (<{ syntestDirectory: string }>(<unknown>this.args))
      .syntestDirectory;
    const stateStorageDirectory = (<StateStorageOptions>(<unknown>this.args))
      .stateStorageDirectory;

    mkdirSync(path.join(baseDirectory, stateStorageDirectory), {
      recursive: true,
    });
  }
}
