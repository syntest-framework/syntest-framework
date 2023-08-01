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
import { UserInterface } from "@syntest/cli-graphics";
import { MetricManager } from "@syntest/metric";
import { Module, ModuleManager } from "@syntest/module";
import { StorageManager } from "@syntest/storage";

import { SearchMetricListener } from "./plugins/event-listeners/SearchMetricListener";
import { SearchProgressBarListener } from "./plugins/event-listeners/SearchProgressBarListener";
import { SimpleObjectiveManagerPlugin } from "./plugins/objective-managers/SimpleObjectiveManagerPlugin";
import { StructuralObjectiveManagerPlugin } from "./plugins/objective-managers/StructuralObjectiveManagerPlugin";
import { StructuralUncoveredObjectiveManagerPlugin } from "./plugins/objective-managers/StructuralUncoveredObjectiveManagerPlugin";
import { TrackingObjectiveManagerPlugin } from "./plugins/objective-managers/TrackingObjectiveManagerPlugin";
import { UncoveredObjectiveManagerPlugin } from "./plugins/objective-managers/UncoveredObjectiveManagerPlugin";
import { DefaultProcreationPlugin } from "./plugins/procreation-operators/DefaultProcreationPlugin";
import { DynaPESAIIPlugin } from "./plugins/search-algorithms/DynaPESAIIPlugin";
import { MOSAFamilyPlugin } from "./plugins/search-algorithms/MOSAFamilyPlugin";
import { NSGAIIPlugin } from "./plugins/search-algorithms/NSGAIIPlugin";
import { PESAIIPlugin } from "./plugins/search-algorithms/PESAIIPlugin";
import { RandomSearchPlugin } from "./plugins/search-algorithms/RandomSearchPlugin";
import { LengthObjectiveComparatorPlugin } from "./plugins/secondary-objectives/LengthObjectiveComparatorPlugin";
import { SignalTerminationTriggerPlugin } from "./plugins/termination-triggers/SignalTerminationTriggerPlugin";
import { DynaMOSAPreset } from "./presets/DynaMOSAPreset";
import { DynaMOSAPESAIIPreset } from "./presets/DynaPESAIIPreset";
import { MOSAPESAIIPreset } from "./presets/MOSAPESAIIPreset";
import { MOSAPreset } from "./presets/MOSAPreset";
import { NSGAIIPreset } from "./presets/NSGAIIPreset";
import { PESAIIPreset } from "./presets/PESAIIPreset";
import { RandomSearchPreset } from "./presets/RandomSearchPreset";

export abstract class TestingToolModule extends Module {
  override register(
    moduleManager: ModuleManager,
    _metricManager: MetricManager,
    _storageManager: StorageManager,
    userInterface: UserInterface,
    _modules: Module[]
  ): void {
    moduleManager.registerPlugin(this, new SearchMetricListener());
    moduleManager.registerPlugin(
      this,
      new SearchProgressBarListener(userInterface)
    );

    moduleManager.registerPlugin(this, new SimpleObjectiveManagerPlugin());
    moduleManager.registerPlugin(this, new StructuralObjectiveManagerPlugin());
    moduleManager.registerPlugin(
      this,
      new StructuralUncoveredObjectiveManagerPlugin()
    );
    moduleManager.registerPlugin(this, new TrackingObjectiveManagerPlugin());
    moduleManager.registerPlugin(this, new UncoveredObjectiveManagerPlugin());

    moduleManager.registerPlugin(this, new LengthObjectiveComparatorPlugin());

    moduleManager.registerPlugin(this, new DefaultProcreationPlugin());

    moduleManager.registerPlugin(this, new MOSAFamilyPlugin());
    moduleManager.registerPlugin(this, new NSGAIIPlugin());
    moduleManager.registerPlugin(this, new RandomSearchPlugin());
    moduleManager.registerPlugin(this, new PESAIIPlugin());
    moduleManager.registerPlugin(this, new DynaPESAIIPlugin());

    moduleManager.registerPlugin(this, new SignalTerminationTriggerPlugin());

    moduleManager.registerPreset(this, new DynaMOSAPreset());
    moduleManager.registerPreset(this, new MOSAPreset());
    moduleManager.registerPreset(this, new NSGAIIPreset());
    moduleManager.registerPreset(this, new RandomSearchPreset());

    moduleManager.registerPreset(this, new PESAIIPreset());
    moduleManager.registerPreset(this, new MOSAPESAIIPreset());
    moduleManager.registerPreset(this, new DynaMOSAPESAIIPreset());
  }
}
