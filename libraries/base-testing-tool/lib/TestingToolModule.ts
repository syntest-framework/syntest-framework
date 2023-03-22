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
import { SimpleObjectiveManagerPlugin } from "./plugins/objectiveManagers/SimpleObjectiveManagerPlugin";
import { StructuralObjectiveManagerPlugin } from "./plugins/objectiveManagers/StructuralObjectiveManagerPlugin";
import { UncoveredObjectiveManagerPlugin } from "./plugins/objectiveManagers/UncoveredObjectiveManagerPlugin";
import { DefaultProcreationPlugin } from "./plugins/procreation-operators/DefaultProcreationPlugin";
import { MOSAFamilyPlugin } from "./plugins/searchAlgorithms/MOSAFamilyPlugin";
import { NSGAIIPlugin } from "./plugins/searchAlgorithms/NSGAIIPlugin";
import { RandomSearchPlugin } from "./plugins/searchAlgorithms/RandomSearchPlugin";
import { SignalTerminationTriggerPlugin } from "./plugins/terminationTriggers/SignalTerminationTriggerPlugin";
import { LengthObjectiveComparatorPlugin } from "./plugins/secondaryObjectives/LengthObjectiveComparatorPlugin";
import { SearchMetricListener } from "./plugins/listeners/SearchMetricListener";
import { MOSAPreset } from "./presets/MOSAPreset";
import { DynaMOSAPreset } from "./presets/DynaMOSAPreset";
import { NSGAIIPreset } from "./presets/NSGAIIPreset";

export abstract class TestingToolModule extends Module {
  register(moduleManager: ModuleManager): void {
    moduleManager.registerPlugin(this.name, new SearchMetricListener());

    moduleManager.registerPlugin(this.name, new SimpleObjectiveManagerPlugin());
    moduleManager.registerPlugin(
      this.name,
      new StructuralObjectiveManagerPlugin()
    );
    moduleManager.registerPlugin(
      this.name,
      new UncoveredObjectiveManagerPlugin()
    );

    moduleManager.registerPlugin(this.name, new DefaultProcreationPlugin());

    moduleManager.registerPlugin(this.name, new MOSAFamilyPlugin());
    moduleManager.registerPlugin(this.name, new NSGAIIPlugin());
    moduleManager.registerPlugin(this.name, new RandomSearchPlugin());

    moduleManager.registerPlugin(
      this.name,
      new LengthObjectiveComparatorPlugin()
    );

    moduleManager.registerPlugin(
      this.name,
      new SignalTerminationTriggerPlugin()
    );

    moduleManager.registerPreset(this.name, new MOSAPreset());
    moduleManager.registerPreset(this.name, new NSGAIIPreset());
    moduleManager.registerPreset(this.name, new DynaMOSAPreset());
  }
}
