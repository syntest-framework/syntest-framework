/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { Encoding } from ".";
import { Configuration } from "./Configuration";
import { EventManager } from "./event/EventManager";
import { PluginManager, pluginManager } from "./plugin/PluginManager";
import {
  DynaMOSAFactory,
  MOSAFactory,
} from "./search/metaheuristics/evolutionary/MOSAFamily";
import Yargs = require("yargs");

import { RandomSearchFactory } from "./search/metaheuristics/RandomSearch";
import { SignalTerminationTriggerFactory } from "./search/termination/SignalTerminationTrigger";
import { NSGAIIFactory } from "./search/metaheuristics/evolutionary/NSGAII";

export abstract class Launcher<T extends Encoding> {
  private _eventManager: EventManager<T>;

  get eventManager() {
    return this._eventManager;
  }

  get programState() {
    return this._eventManager.state;
  }

  constructor(eventManager: EventManager<T>) {
    this._eventManager = eventManager;
  }

  public async run(): Promise<void> {
    try {
      // Register all listener plugins
      for (const pluginName of pluginManager.getListeners()) {
        const plugin = pluginManager.getListener(pluginName);
        this.eventManager.registerListener(plugin.createListener({}));
      }

      await pluginManager.prepare();
      this.eventManager.emitEvent("onInitializeStart");
      await this.initialize();
      this.eventManager.emitEvent("onInitializeComplete");
      this.eventManager.emitEvent("onPreprocessStart");
      await this.preprocess();
      this.eventManager.emitEvent("onPreprocessComplete");
      this.eventManager.emitEvent("onProcessStart");
      await this.process();
      this.eventManager.emitEvent("onProcessComplete");
      this.eventManager.emitEvent("onPostprocessStart");
      await this.postprocess();
      this.eventManager.emitEvent("onPostprocessComplete");
      await pluginManager.cleanup();
      this.eventManager.emitEvent("onExit");
      await this.exit();
    } catch (e) {
      console.log(e);
      console.trace(e);
    }
  }

  abstract initialize(): Promise<void>;
  abstract preprocess(): Promise<void>;
  abstract process(): Promise<void>;
  abstract postprocess(): Promise<void>;
  abstract exit(): Promise<void>;
}
