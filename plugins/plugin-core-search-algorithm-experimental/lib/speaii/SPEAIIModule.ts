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

import { Module, ModuleManager } from "@syntest/module";

import { DynaSPEAIIPlugin } from "./plugins/DynaSPEAIIPlugin";
import { SPEAIIPlugin } from "./plugins/SPEAIIPlugin";
import { DynaMOSASPEAIIPreset } from "./presets/DynaMOSASPEAIIPreset";
import { MOSASPEAIIPreset } from "./presets/MOSASPEAIIPreset";
import { SPEAIIPreset } from "./presets/SPEAIIPreset";

/**
 * SPEAII module
 */
export default class SPEAIIModule extends Module {
  constructor() {
    super(
      // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").name,
      // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").version
    );
  }

  register(moduleManager: ModuleManager): void {
    moduleManager.registerPlugin(this, new SPEAIIPlugin());
    moduleManager.registerPlugin(this, new DynaSPEAIIPlugin());

    moduleManager.registerPreset(this, new SPEAIIPreset());
    moduleManager.registerPreset(this, new MOSASPEAIIPreset());
    moduleManager.registerPreset(this, new DynaMOSASPEAIIPreset());
  }
}
