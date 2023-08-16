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
import { MOSAFamilyPlugin } from "./plugins/search-algorithms/MOSAFamilyPlugin";
import { NSGAIIPlugin } from "./plugins/search-algorithms/NSGAIIPlugin";
import { RandomSearchPlugin } from "./plugins/search-algorithms/RandomSearchPlugin";
import { LengthObjectiveComparatorPlugin } from "./plugins/secondary-objectives/LengthObjectiveComparatorPlugin";
import { SignalTerminationTriggerPlugin } from "./plugins/termination-triggers/SignalTerminationTriggerPlugin";
import { DynaMOSAPreset } from "./presets/DynaMOSAPreset";
import { DynaMOSA10Preset } from "./presets/DynaMOSAPreset10";
import { DynaMOSA20Preset } from "./presets/DynaMOSAPreset20";
import { DynaMOSA30Preset } from "./presets/DynaMOSAPreset30";
import { DynaMOSA40Preset } from "./presets/DynaMOSAPreset40";
import { DynaMOSA5Preset } from "./presets/DynaMOSAPreset5";
import { DynaMOSANoTypePreset } from "./presets/DynaMOSAPresetNoType";
import { DynaMOSAProbPreset } from "./presets/DynaMOSAPresetProb";
import { DynaMOSAProbAllPreset } from "./presets/DynaMOSAPresetProbAll";
import { DynaMOSAProbDynPreset } from "./presets/DynaMOSAPresetProbDyn";
import { DynaMOSAProbPoolPreset } from "./presets/DynaMOSAPresetProbPool";
import { DynaMOSARankedPreset } from "./presets/DynaMOSAPresetRanked";
import { DynaMOSARankedAllPreset } from "./presets/DynaMOSAPresetRankedAll";
import { DynaMOSARankedDynPreset } from "./presets/DynaMOSAPresetRankedDyn";
import { DynaMOSARankedPoolPreset } from "./presets/DynaMOSAPresetRankedPool";
import { MOSAPreset } from "./presets/MOSAPreset";
import { MOSA10Preset } from "./presets/MOSAPreset10";
import { MOSA20Preset } from "./presets/MOSAPreset20";
import { MOSA30Preset } from "./presets/MOSAPreset30";
import { MOSA40Preset } from "./presets/MOSAPreset40";
import { MOSA5Preset } from "./presets/MOSAPreset5";
import { NSGAIIPreset } from "./presets/NSGAIIPreset";
import { NSGAII10Preset } from "./presets/NSGAIIPreset10";
import { NSGAII20Preset } from "./presets/NSGAIIPreset20";
import { NSGAII30Preset } from "./presets/NSGAIIPreset30";
import { NSGAII40Preset } from "./presets/NSGAIIPreset40";
import { NSGAII5Preset } from "./presets/NSGAIIPreset5";
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

    moduleManager.registerPlugin(this, new SignalTerminationTriggerPlugin());

    moduleManager.registerPreset(this, new DynaMOSAPreset());
    moduleManager.registerPreset(this, new MOSAPreset());
    moduleManager.registerPreset(this, new NSGAIIPreset());
    moduleManager.registerPreset(this, new RandomSearchPreset());

    moduleManager.registerPreset(this, new DynaMOSANoTypePreset());
    moduleManager.registerPreset(this, new DynaMOSAProbPreset());
    moduleManager.registerPreset(this, new DynaMOSAProbAllPreset());
    moduleManager.registerPreset(this, new DynaMOSAProbDynPreset());
    moduleManager.registerPreset(this, new DynaMOSAProbPoolPreset());
    moduleManager.registerPreset(this, new DynaMOSARankedPreset());
    moduleManager.registerPreset(this, new DynaMOSARankedAllPreset());
    moduleManager.registerPreset(this, new DynaMOSARankedDynPreset());
    moduleManager.registerPreset(this, new DynaMOSARankedPoolPreset());

    moduleManager.registerPreset(this, new NSGAII5Preset());
    moduleManager.registerPreset(this, new MOSA5Preset());
    moduleManager.registerPreset(this, new DynaMOSA5Preset());

    moduleManager.registerPreset(this, new NSGAII10Preset());
    moduleManager.registerPreset(this, new MOSA10Preset());
    moduleManager.registerPreset(this, new DynaMOSA10Preset());

    moduleManager.registerPreset(this, new NSGAII20Preset());
    moduleManager.registerPreset(this, new MOSA20Preset());
    moduleManager.registerPreset(this, new DynaMOSA20Preset());

    moduleManager.registerPreset(this, new NSGAII30Preset());
    moduleManager.registerPreset(this, new MOSA30Preset());
    moduleManager.registerPreset(this, new DynaMOSA30Preset());

    moduleManager.registerPreset(this, new NSGAII40Preset());
    moduleManager.registerPreset(this, new MOSA40Preset());
    moduleManager.registerPreset(this, new DynaMOSA40Preset());
  }
}
