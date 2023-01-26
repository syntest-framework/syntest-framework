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

import { Encoding, NSGAIIFactory, UserInterface } from ".";
import { ArgumentsObject, Configuration, OptionsObject } from "./Configuration";
import { EventManager } from "./event/EventManager";
import { PluginManager } from "./plugin/PluginManager";
import {
  DynaMOSAFactory,
  MOSAFactory,
} from "./search/metaheuristics/evolutionary/mosa/MOSA";
import Yargs = require("yargs");
import { RandomSearchFactory } from "./search/metaheuristics/RandomSearch";

export abstract class Launcher<T extends Encoding> {
  private _eventManager: EventManager<T>;
  private _pluginManager: PluginManager<T>;
  private _programName: string;
  private _ui: UserInterface;

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

  get ui() {
    return this._ui;
  }

  constructor(
    programName: string,
    eventManager: EventManager<T>,
    pluginManager: PluginManager<T>,
    ui: UserInterface
  ) {
    this._programName = programName;
    this._eventManager = eventManager;
    this._pluginManager = pluginManager;
    this._ui = ui;
  }

  public async run(args: string[]): Promise<void> {
    try {
      const configuration = new Configuration(this.programName);
      const yargs = configuration.configureOptions();
      const baseArguments = await configuration.processArguments(yargs, args);
      const yargs2 = await this.addOptions(yargs);
      const yargs3 = await this.registerPlugins(baseArguments.plugins, yargs2);

      configuration.initializeConfigSingleton(
        await this.configure(yargs3, args)
      );

      for (const plugin of this.pluginManager.listenerPlugins.values()) {
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

  async registerPlugins<T>(plugins: string[], yargs: Yargs.Argv<T>) {
    // register standard search algorithms
    this.pluginManager.registerSearchAlgorithm(new RandomSearchFactory());
    this.pluginManager.registerSearchAlgorithm(new NSGAIIFactory());
    this.pluginManager.registerSearchAlgorithm(new MOSAFactory());
    this.pluginManager.registerSearchAlgorithm(new DynaMOSAFactory());

    // register standard crossover operators
    // register standard ranking operators
    // register standard selection operators
    // register standard samplers
    // register standard termination triggers
    // register standard objective managers
    // register standard user-interfaces

    // load external plugins
    for (const plugin of plugins) {
      await this.pluginManager.loadPlugin(plugin);
    }

    // add plugin options
    return this.pluginManager.addPluginOptions(yargs);
  }

  /**
   * This function should configure the argument options in the language specific tool.
   * @param yargs
   */
  abstract addOptions<T>(yargs: Yargs.Argv<T>): Yargs.Argv<T>;

  /**
   * This function should parse the arguments and given config files.
   * @param yargs
   * @param args
   */
  abstract configure(
    yargs: OptionsObject,
    args: string[]
  ): Promise<ArgumentsObject>;

  abstract initialize(): Promise<void>;
  abstract preprocess(): Promise<void>;
  abstract process(): Promise<void>;
  abstract postprocess(): Promise<void>;
  abstract exit(): Promise<void>;
}
