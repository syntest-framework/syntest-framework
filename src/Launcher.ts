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

import { Encoding } from "./search/Encoding";
import { ArgumentsObject, Configuration } from "./Configuration";
import { EventManager } from "./event/EventManager";
import { PluginManager } from "./plugin/PluginManager";
import {
  DynaMOSAFactory,
  MOSAFactory,
} from "./search/metaheuristics/evolutionary/MOSAFamily";
import Yargs = require("yargs");

import { RandomSearchFactory } from "./search/metaheuristics/RandomSearch";
import { SfuzzFactory } from "./search/metaheuristics/evolutionary/Sfuzz";
import { SignalTerminationTriggerFactory } from "./search/termination/SignalTerminationTrigger";
import { NSGAIIFactory } from "./search/metaheuristics/evolutionary/NSGAII";
import { StructuralObjectiveManagerFactory } from "./search/objective/managers/StructuralObjectiveManager";
import {
  SimpleObjectiveManagerFactory,
  UncoveredObjectiveManagerFactory,
  SfuzzObjectiveManagerFactory,
} from ".";
import yargHelper = require("yargs/helpers");

export abstract class Launcher<T extends Encoding> {
  private _eventManager: EventManager<T>;
  private _pluginManager: PluginManager<T>;
  private _programName: string;
  private _configuration: Configuration;

  get eventManager() {
    return this._eventManager;
  }

  get pluginManager() {
    return this._pluginManager;
  }

  get programState() {
    return this._eventManager.state;
  }

  get programName() {
    return this._programName;
  }

  get configuration() {
    return this._configuration;
  }

  constructor(
    programName: string,
    eventManager: EventManager<T>,
    pluginManager: PluginManager<T>
  ) {
    this._programName = programName;
    this._eventManager = eventManager;
    this._pluginManager = pluginManager;
    this._configuration = new Configuration();
  }

  public async run(args: string[]): Promise<void> {
    try {
      // Remove binary call from args
      args = yargHelper.hideBin(args);

      // Configure base options
      const yargs1 = this.configuration.configureOptions(this.programName);
      // Parse the arguments and config using only the base options
      const baseArguments = await this.configuration.processArguments(
        yargs1,
        args
      );
      // Add the language specific tool options
      const yargs2 = await this.addOptions(yargs1);
      // Register the plugins and add the plugin options
      const yargs3 = await this.registerPlugins(baseArguments.plugins, yargs2);
      // Parse the arguments and config using all options
      const argValues = await this.configuration.processArguments(yargs3, args);
      // Initialize the configuration object
      this.configuration.initialize(argValues);

      // Register all listener plugins
      for (const plugin of this.pluginManager.listeners.values()) {
        this.eventManager.registerListener(plugin.createListener({}));
      }

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
      this.eventManager.emitEvent("onExit");
      await this.exit();
    } catch (e) {
      console.log(e);
      console.trace(e);
    }
  }

  /**
   * This function should configure the argument options in the language specific tool.
   * @param yargs
   */
  abstract addOptions<Y>(yargs: Yargs.Argv<Y>): Yargs.Argv<Y>;

  async registerPlugins<Y>(plugins: string[], yargs: Yargs.Argv<Y>) {
    // register standard search algorithms
    this.pluginManager.registerSearchAlgorithm(new RandomSearchFactory());
    this.pluginManager.registerSearchAlgorithm(new NSGAIIFactory());
    this.pluginManager.registerSearchAlgorithm(new MOSAFactory());
    this.pluginManager.registerSearchAlgorithm(new DynaMOSAFactory());
    this.pluginManager.registerSearchAlgorithm(new SfuzzFactory());

    // register standard crossover operators

    // register standard samplers

    // register standard termination triggers
    this.pluginManager.registerTermination(
      new SignalTerminationTriggerFactory()
    );

    // register standard objective managers
    this.pluginManager.registerObjectiveManager(
      new SimpleObjectiveManagerFactory()
    );
    this.pluginManager.registerObjectiveManager(
      new StructuralObjectiveManagerFactory()
    );
    this.pluginManager.registerObjectiveManager(
      new UncoveredObjectiveManagerFactory()
    );
    this.pluginManager.registerObjectiveManager(
      new SfuzzObjectiveManagerFactory()
    );

    // register standard user-interfaces

    // load external plugins
    for (const plugin of plugins) {
      await this.pluginManager.loadPlugin(plugin);
    }

    // add plugin options
    return this.pluginManager.addPluginOptions(yargs);
  }

  abstract initialize(): Promise<void>;
  abstract preprocess(): Promise<void>;
  abstract process(): Promise<void>;
  abstract postprocess(): Promise<void>;
  abstract exit(): Promise<void>;
}
