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
import { Encoding } from "../search/Encoding";
import { CrossoverPlugin } from "./CrossoverPlugin";
import { ListenerPlugin } from "./ListenerPlugin";
import { PluginInterface } from "./PluginInterface";
import { SamplerPlugin } from "./SamplerPlugin";
import { SearchAlgorithmPlugin } from "./SearchAlgorithmPlugin";
import { TerminationPlugin } from "./TerminationPlugin";
import { UserInterfacePlugin } from "./UserInterfacePlugin";
import Yargs = require("yargs");

export let pluginManager: PluginManager<Encoding>;

export function createPluginManager<T extends Encoding>() {
  pluginManager = new PluginManager<T>();
}

export class PluginManager<T extends Encoding> {
  private _listeners: Map<string, ListenerPlugin<T>>;
  private _searchAlgorithms: Map<string, SearchAlgorithmPlugin<T>>;
  private _crossoverOperators: Map<string, CrossoverPlugin<T>>;
  private _samplers: Map<string, SamplerPlugin<T>>;
  private _terminationTriggers: Map<string, TerminationPlugin<T>>;
  private _userInterfaces: Map<string, UserInterfacePlugin<T>>;

  constructor() {
    this._listeners = new Map();
    this._searchAlgorithms = new Map();
    this._crossoverOperators = new Map();
    this._samplers = new Map();
    this._terminationTriggers = new Map();
    this._userInterfaces = new Map();
  }

  getListeners(): string[] {
    return [...this._listeners.keys()];
  }

  getSearchAlgorithms(): string[] {
    return [...this._searchAlgorithms.keys()];
  }

  getCrossoverOperators(): string[] {
    return [...this._crossoverOperators.keys()];
  }

  getSamplers(): string[] {
    return [...this._samplers.keys()];
  }

  getTerminationTriggers(): string[] {
    return [...this._terminationTriggers.keys()];
  }

  getUserInterfaces(): string[] {
    return [...this._userInterfaces.keys()];
  }

  getListener(name: string): ListenerPlugin<T> {
    return this._listeners.get(name);
  }

  getSearchAlgorithm(name: string): SearchAlgorithmPlugin<T> {
    return this._searchAlgorithms.get(name);
  }

  getCrossoverOperator(name: string): CrossoverPlugin<T> {
    return this._crossoverOperators.get(name);
  }

  getSampler(name: string): SamplerPlugin<T> {
    return this._samplers.get(name);
  }

  getTerminationTrigger(name: string): TerminationPlugin<T> {
    return this._terminationTriggers.get(name);
  }

  getUserInterface(name: string): UserInterfacePlugin<T> {
    return this._userInterfaces.get(name);
  }

  async addPluginOptions<Y>(yargs: Yargs.Argv<Y>) {
    yargs = await this._addPluginOptionsSpecific(yargs, this._listeners);
    yargs = await this._addPluginOptionsSpecific(yargs, this._searchAlgorithms);
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._crossoverOperators
    );
    yargs = await this._addPluginOptionsSpecific(yargs, this._samplers);
    yargs = await this._addPluginOptionsSpecific(
      yargs,
      this._terminationTriggers
    );
    yargs = await this._addPluginOptionsSpecific(yargs, this._userInterfaces);

    return yargs;
  }

  private async _addPluginOptionsSpecific<Y, X extends PluginInterface<T>>(
    yargs: Yargs.Argv<Y>,
    plugins: Map<string, X>
  ) {
    for (const plugin of plugins.values()) {
      if (plugin.getConfig) {
        const options = await plugin.getConfig();

        for (const option of options.keys()) {
          yargs = yargs.option(`${plugin.name}-${option}`, options.get(option));
        }
      }
    }
    return yargs;
  }

  async cleanup() {
    await this._cleanupSpecific(this._listeners);
    await this._cleanupSpecific(this._searchAlgorithms);
    await this._cleanupSpecific(this._crossoverOperators);
    await this._cleanupSpecific(this._samplers);
    await this._cleanupSpecific(this._terminationTriggers);
    await this._cleanupSpecific(this._userInterfaces);
  }

  private async _cleanupSpecific<X extends PluginInterface<T>>(
    plugins: Map<string, X>
  ) {
    for (const plugin of plugins.values()) {
      if (plugin.cleanup) {
        await plugin.cleanup();
      }
    }
  }

  async prepare() {
    await this._prepareSpecific(this._listeners);
    await this._prepareSpecific(this._searchAlgorithms);
    await this._prepareSpecific(this._crossoverOperators);
    await this._prepareSpecific(this._samplers);
    await this._prepareSpecific(this._terminationTriggers);
    await this._prepareSpecific(this._userInterfaces);
  }

  private async _prepareSpecific<X extends PluginInterface<T>>(
    plugins: Map<string, X>
  ) {
    for (const plugin of plugins.values()) {
      if (plugin.prepare) {
        await plugin.prepare();
      }
    }
  }

  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const { plugin } = await import(pluginPath);
      const pluginInstance: PluginInterface<T> = new plugin.default();

      if (!pluginInstance.register) {
        throw new Error(
          `Could not load plugin\nPlugin has no register function\nPlugin: ${pluginPath}`
        );
      }

      pluginInstance.register(this);
    } catch (e) {
      console.trace(e);
    }
  }

  async registerListener(plugin: ListenerPlugin<T>): Promise<void> {
    if (this._listeners.has(plugin.name)) {
      throw new Error(
        `Plugin with name: ${plugin.name} is already registered as a listener plugin.`
      );
    }
    this._listeners.set(plugin.name, plugin);
  }

  async registerSearchAlgorithm(
    plugin: SearchAlgorithmPlugin<T>
  ): Promise<void> {
    if (this._searchAlgorithms.has(plugin.name)) {
      throw new Error(
        `Plugin with name: ${plugin.name} is already registered as a search algorithm plugin.`
      );
    }
    this._searchAlgorithms.set(plugin.name, plugin);
  }

  async registerCrossover(plugin: CrossoverPlugin<T>): Promise<void> {
    if (this._crossoverOperators.has(plugin.name)) {
      throw new Error(
        `Plugin with name: ${plugin.name} is already registered as a crossover plugin.`
      );
    }
    this._crossoverOperators.set(plugin.name, plugin);
  }

  async registerSampler(plugin: SamplerPlugin<T>): Promise<void> {
    if (this._samplers.has(plugin.name)) {
      throw new Error(
        `Plugin with name: ${plugin.name} is already registered as a sampler plugin.`
      );
    }
    this._samplers.set(plugin.name, plugin);
  }

  async registerTermination(plugin: TerminationPlugin<T>): Promise<void> {
    if (this._terminationTriggers.has(plugin.name)) {
      throw new Error(
        `Plugin with name: ${plugin.name} is already registered as a termination trigger plugin.`
      );
    }
    this._terminationTriggers.set(plugin.name, plugin);
  }

  async registerUserInterface(plugin: UserInterfacePlugin<T>): Promise<void> {
    if (this._userInterfaces.has(plugin.name)) {
      throw new Error(
        `Plugin with name: ${plugin.name} is already registered as a user-interface plugin.`
      );
    }
    this._userInterfaces.set(plugin.name, plugin);
  }
}
