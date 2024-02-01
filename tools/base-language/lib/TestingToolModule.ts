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

import { ExtensionRegistrationAPI, Module } from "@syntest/module";

import { SearchMetricListener } from "./plugins/event-listeners/SearchMetricListener";
import { SearchPerformanceListener } from "./plugins/event-listeners/SearchPerformanceListener";
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
import { LeastErrorsObjectiveComparatorPlugin } from "./plugins/secondary-objectives/LeastErrorsObjectiveComparatorPlugin";
import { SmallestEncodingObjectiveComparatorPlugin } from "./plugins/secondary-objectives/SmallestEncodingObjectiveComparatorPlugin";
import { SignalTerminationTriggerPlugin } from "./plugins/termination-triggers/SignalTerminationTriggerPlugin";
import { DynaMOSAPreset } from "./presets/DynaMOSAPreset";
import { MOSAPreset } from "./presets/MOSAPreset";
import { NSGAIIPreset } from "./presets/NSGAIIPreset";
import { RandomSearchPreset } from "./presets/RandomSearchPreset";

export abstract class TestingToolModule extends Module {
  override register(extensionRegistrationApi: ExtensionRegistrationAPI): void {
    extensionRegistrationApi.registerPlugin(new SearchMetricListener());
    extensionRegistrationApi.registerPlugin(new SearchPerformanceListener());
    extensionRegistrationApi.registerPlugin(new SearchProgressBarListener());

    extensionRegistrationApi.registerPlugin(new SimpleObjectiveManagerPlugin());
    extensionRegistrationApi.registerPlugin(
      new StructuralObjectiveManagerPlugin()
    );
    extensionRegistrationApi.registerPlugin(
      new StructuralUncoveredObjectiveManagerPlugin()
    );
    extensionRegistrationApi.registerPlugin(
      new TrackingObjectiveManagerPlugin()
    );
    extensionRegistrationApi.registerPlugin(
      new UncoveredObjectiveManagerPlugin()
    );

    extensionRegistrationApi.registerPlugin(
      new LeastErrorsObjectiveComparatorPlugin()
    );
    extensionRegistrationApi.registerPlugin(
      new SmallestEncodingObjectiveComparatorPlugin()
    );

    extensionRegistrationApi.registerPlugin(new DefaultProcreationPlugin());

    extensionRegistrationApi.registerPlugin(new MOSAFamilyPlugin());
    extensionRegistrationApi.registerPlugin(new NSGAIIPlugin());
    extensionRegistrationApi.registerPlugin(new RandomSearchPlugin());

    extensionRegistrationApi.registerPlugin(
      new SignalTerminationTriggerPlugin()
    );

    extensionRegistrationApi.registerPreset(new DynaMOSAPreset());
    extensionRegistrationApi.registerPreset(new MOSAPreset());
    extensionRegistrationApi.registerPreset(new NSGAIIPreset());
    extensionRegistrationApi.registerPreset(new RandomSearchPreset());
  }
}
