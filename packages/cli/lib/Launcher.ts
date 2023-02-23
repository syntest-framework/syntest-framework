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

import { Encoding } from "../../core/lib";
import { Configuration } from "../../core/lib/Configuration";
import { EventManager } from "../../core/lib/event/EventManager";
import { PluginManager } from "./PluginManager";

import {
  DynaMOSAFactory,
  MOSAFactory,
} from "../../core/lib/search/metaheuristics/evolutionary/MOSAFamily";
import Yargs = require("yargs");

import { RandomSearchFactory } from "../../core/lib/search/metaheuristics/RandomSearch";
import { SignalTerminationTriggerFactory } from "../../core/lib/search/termination/SignalTerminationTrigger";
import { NSGAIIFactory } from "../../core/lib/search/metaheuristics/evolutionary/NSGAII";
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
      for (const pluginName of this.pluginManager.getListeners()) {
        const plugin = this.pluginManager.getListener(pluginName);
        this.eventManager.registerListener(plugin.createListener({}));
      }

      await this.pluginManager.prepare();
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
      await this.pluginManager.cleanup();
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

    // register standard termination triggers
    this.pluginManager.registerTermination(
      new SignalTerminationTriggerFactory()
    );

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
