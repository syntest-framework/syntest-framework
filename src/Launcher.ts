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

import { Encoding, UserInterface } from ".";
import { EventManager } from "./event/EventManager";
import { PluginManager } from "./plugin/PluginManager";
import {
  DynaMOSAFactory,
  MOSAFactory,
} from "./search/metaheuristics/evolutionary/mosa/MOSA";

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
      await this.registerPlugins();
      await this.configure(args);
      // await this.executePlugins(yargs)

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

  async registerPlugins() {
    // register standard search algorithms
    this.pluginManager.registerSearchAlgorithm(new MOSAFactory());
    this.pluginManager.registerSearchAlgorithm(new DynaMOSAFactory());

    // register standard crossover operators
    // register standard ranking operators
    // register standard selection operators
    // register standard samplers
    // register standard termination triggers
    // register standard objective managers
    // register standard user-interfaces

    // TODO read config and load plugins
    // this.pluginManager.loadPlugin()
  }

  abstract configure(args: string[]): Promise<void>;

  async executePlugins() {
    // this.eventManager.state.algorithm =
  }

  abstract initialize(): Promise<void>;
  abstract preprocess(): Promise<void>;
  abstract process(): Promise<void>;
  abstract postprocess(): Promise<void>;
  abstract exit(): Promise<void>;
}
