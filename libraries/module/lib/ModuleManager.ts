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
import * as path from "path";
import { existsSync } from "fs";
import globalModules = require("global-modules");
import Yargs = require("yargs");
import { Plugin } from "./extension/Plugin";
import { Tool } from "./extension/Tool";
import { Module } from "./extension/Module";
import { UserInterface } from "@syntest/cli-graphics";

import {
  moduleAlreadyLoaded,
  moduleCannotBeLoaded,
  moduleNotCorrectlyImplemented,
  moduleNotInstalled,
  modulePathNotFound,
  pluginAlreadyLoaded,
  pluginNotFound,
  presetAlreadyLoaded,
  presetNotFound,
  toolAlreadyLoaded,
} from "./util/diagnostics";
import { getLogger } from "@syntest/logging";
import { Metric, MetricManager } from "@syntest/metric";
import { Preset } from "./extension/Preset";

export class ModuleManager {
  static LOGGER = getLogger("ModuleManager");

  private _metricManager: MetricManager;
  private _userInterface: UserInterface;

  private _args: Yargs.ArgumentsCamelCase;

  private _modules: Map<string, Module>;
  private _tools: Map<string, Tool>;
  // type -> name -> plugin
  private _plugins: Map<string, Map<string, Plugin>>;
  private _presets: Map<string, Preset>;

  private _toolsOfModule: Map<string, Tool[]>;
  private _pluginsOfModule: Map<string, Plugin[]>;
  private _presetsOfModule: Map<string, Preset[]>;

  constructor(metricManager: MetricManager, userInterface: UserInterface) {
    this._metricManager = metricManager;
    this._userInterface = userInterface;

    this._modules = new Map();
    this._tools = new Map();
    this._plugins = new Map();
    this._presets = new Map();

    this._toolsOfModule = new Map();
    this._pluginsOfModule = new Map();
    this._presetsOfModule = new Map();
  }

  set args(args: Yargs.ArgumentsCamelCase) {
    this._args = args;
    for (const module of this.modules.values()) {
      module.args = args;
    }

    for (const tool of this.tools.values()) {
      tool.args = args;
    }

    for (const pluginsOfType of this.plugins.values()) {
      for (const plugin of pluginsOfType.values()) {
        plugin.args = args;
      }
    }

    for (const preset of this.presets.values()) {
      preset.args = args;
    }
  }

  get modules() {
    return this._modules;
  }

  get tools() {
    return this._tools;
  }

  get plugins() {
    return this._plugins;
  }

  get presets() {
    return this._presets;
  }

  get toolsOfModule() {
    return this._toolsOfModule;
  }

  get pluginsOfModule() {
    return this._pluginsOfModule;
  }

  get presetsOfModule() {
    return this._presetsOfModule;
  }

  getPlugin(type: string, name: string): Plugin {
    if (!this._plugins.has(type)) {
      throw new Error(pluginNotFound(name, type));
    }

    if (!this._plugins.get(type).has(name)) {
      throw new Error(pluginNotFound(name, type));
    }

    return this._plugins.get(type).get(name);
  }

  getPluginsOfType(type: string): Map<string, Plugin> {
    if (!this._plugins.has(type)) {
      return new Map();
    }

    return this._plugins.get(type);
  }

  async getMetrics(): Promise<Metric[]> {
    const metrics: Metric[] = [];

    for (const tool of this.tools.values()) {
      metrics.push(...(await tool.getMetrics()));
    }

    for (const pluginsOfType of this.plugins.values()) {
      for (const plugin of pluginsOfType.values()) {
        metrics.push(...(await plugin.getMetrics()));
      }
    }

    return metrics;
  }

  async prepare() {
    ModuleManager.LOGGER.info("Preparing modules");
    for (const module of this.modules.values()) {
      if (module.prepare) {
        ModuleManager.LOGGER.info(`Preparing module: ${module.name}`);
        await module.prepare();
        ModuleManager.LOGGER.info(`Module prepared: ${module.name}`);
      }
    }
  }

  async cleanup() {
    ModuleManager.LOGGER.info("Cleaning up modules");
    for (const module of this.modules.values()) {
      if (module.cleanup) {
        ModuleManager.LOGGER.info(`Cleaning up module: ${module.name}`);
        await module.cleanup();
        ModuleManager.LOGGER.info(`Module cleaned up: ${module.name}`);
      }
    }
  }

  async getModulePath(module: string): Promise<string> {
    let modulePath = "";

    if (module.startsWith("file:")) {
      // It is a file path
      modulePath = path.resolve(module.replace("file:", ""));
      if (!existsSync(modulePath)) {
        throw new Error(modulePathNotFound(module));
      }
    } else {
      // It is a npm package
      modulePath = path.resolve(path.join("node_modules", module));

      if (!existsSync(modulePath)) {
        // it is not locally installed lets try global
        modulePath = path.resolve(path.join(globalModules, module));
      }

      if (!existsSync(modulePath)) {
        // it is not installed locally nor globally
        // TODO maybe auto install?
        throw new Error(moduleNotInstalled(module));
      }
    }

    return modulePath;
  }

  async loadModule(moduleId: string, modulePath: string) {
    const { module } = await import(modulePath);

    const moduleInstance: Module = new module.default();

    // check requirements
    if (!moduleInstance.name) {
      throw new Error(moduleNotCorrectlyImplemented("name", moduleId));
    }
    if (!moduleInstance.register) {
      throw new Error(moduleNotCorrectlyImplemented("register", moduleId));
    }

    if (this.modules.has(moduleInstance.name)) {
      throw new Error(moduleAlreadyLoaded(moduleInstance.name, moduleId));
    }

    this.modules.set(moduleInstance.name, moduleInstance);
    this._presetsOfModule.set(moduleInstance.name, []);
    this._toolsOfModule.set(moduleInstance.name, []);
    this._pluginsOfModule.set(moduleInstance.name, []);
    ModuleManager.LOGGER.info(`Module loaded: ${moduleId}`);
  }

  async loadModules(modulesIds: string[]) {
    // Load modules
    for (const module of modulesIds) {
      try {
        ModuleManager.LOGGER.info(`Loading module: ${module}`);
        const modulePath = await this.getModulePath(module);
        await this.loadModule(module, modulePath);
      } catch (e) {
        console.log(e);
        throw new Error(moduleCannotBeLoaded(module));
      }
    }

    const modules = Array.from(this.modules.values());
    for (const module of this.modules.values()) {
      module.register(this, this._metricManager, this._userInterface, modules);
    }
  }

  registerPreset(module: string, preset: Preset) {
    if (this.presets.has(preset.name)) {
      throw new Error(presetAlreadyLoaded(preset.name));
    }

    ModuleManager.LOGGER.info(`Preset loaded: ${preset.name}`);
    this.presets.set(preset.name, preset);
    this._presetsOfModule.get(module).push(preset);
  }

  registerTool(module: string, tool: Tool) {
    if (this.tools.has(tool.name)) {
      throw new Error(toolAlreadyLoaded(tool.name));
    }

    ModuleManager.LOGGER.info(`Tool loaded: ${tool.name}`);
    this.tools.set(tool.name, tool);
    this._toolsOfModule.get(module).push(tool);
  }

  registerPlugin(module: string, plugin: Plugin) {
    if (!this.plugins.has(plugin.type)) {
      this.plugins.set(plugin.type, new Map());
    }

    if (this.plugins.get(plugin.type).has(plugin.name)) {
      throw new Error(pluginAlreadyLoaded(plugin.name, plugin.type));
    }

    ModuleManager.LOGGER.info(
      `- Plugin loaded: ${plugin.type} - ${plugin.name}`
    );
    this.plugins.get(plugin.type).set(plugin.name, plugin);
    this._pluginsOfModule.get(module).push(plugin);
  }

  async configureModules(yargs: Yargs.Argv, preset: string) {
    ModuleManager.LOGGER.info("Configuring modules");
    for (const tool of this.tools.values()) {
      const plugins = [];
      for (const pluginsOfType of this.plugins.values()) {
        for (const plugin of pluginsOfType.values()) {
          plugins.push(plugin);
        }
      }
      await tool.addPluginOptions(plugins);
      yargs = yargs.command(tool);
    }

    ModuleManager.LOGGER.info("Setting preset");
    if (!this.presets.has(preset)) {
      throw new Error(presetNotFound(preset));
    }

    yargs = yargs.middleware(
      <Yargs.MiddlewareFunction>(<unknown>this.presets.get(preset).modifyArgs)
    );

    return yargs;
  }
}
