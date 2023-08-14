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

import { SFuzzObjectiveManagerPlugin } from "./sfuzz/SFuzzObjectiveManagerPlugin";
import { SFuzzPreset } from "./sfuzz/SFuzzPreset";
import { SFuzzSearchAlgorithmPlugin } from "./sfuzz/SFuzzSearchAlgorithmPlugin";
import { DynaSPEA2Plugin } from "./spea2/plugins/DynaSPEA2Plugin";
import { SPEA2Plugin } from "./spea2/plugins/SPEA2Plugin";
import { DynaMOSASPEA2HighestPreset } from "./spea2/presets/DynaMOSASPEA2HighestPreset";
import { DynaMOSASPEA2Preset } from "./spea2/presets/DynaMOSASPEA2Preset";
import { DynaMOSASPEA2SumPreset } from "./spea2/presets/DynaMOSASPEA2SumPreset";
import { MOSASPEA2Preset } from "./spea2/presets/MOSASPEA2Preset";
import { SPEA2Preset } from "./spea2/presets/SPEA2Preset";

/**
 * Experimental module
 */
export default class ExperimentalModule extends Module {
  constructor() {
    super(
      // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").name,
      // eslint-disable-next-line @typescript-eslint/no-var-requires,unicorn/prefer-module, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").version
    );
  }

  register(moduleManager: ModuleManager): void {
    moduleManager.registerPlugin(this, new SFuzzObjectiveManagerPlugin());
    moduleManager.registerPlugin(this, new SFuzzSearchAlgorithmPlugin());
    moduleManager.registerPreset(this, new SFuzzPreset());

    moduleManager.registerPlugin(this, new SPEA2Plugin());
    moduleManager.registerPlugin(this, new DynaSPEA2Plugin());
    moduleManager.registerPreset(this, new SPEA2Preset());
    moduleManager.registerPreset(this, new MOSASPEA2Preset());
    moduleManager.registerPreset(this, new DynaMOSASPEA2Preset());
    moduleManager.registerPreset(this, new DynaMOSASPEA2HighestPreset());
    moduleManager.registerPreset(this, new DynaMOSASPEA2SumPreset());
  }
}
