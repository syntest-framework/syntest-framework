/*
 * Copyright 2020-2023 SynTest contributors
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
import { existsSync } from "node:fs";
import * as path from "node:path";

import { ItemizationItem, UserInterface } from "@syntest/cli-graphics";
import { getLogger, Logger } from "@syntest/logging";
import { Metric, MetricManager, MetricOptions } from "@syntest/metric";
import { StorageManager } from "@syntest/storage";
import globalModules = require("global-modules");
import Yargs = require("yargs");

import { Module } from "./extension/Module";
import { Plugin } from "./extension/Plugin";
import { MetricMiddlewarePlugin } from "./extension/plugins/MetricMiddlewarePlugin";
import { PluginType } from "./extension/plugins/PluginType";
import { Preset } from "./extension/Preset";
import { Tool } from "./extension/Tool";
import { OptionGroups } from "./util/Configuration";
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

export class ModuleManager {
  protected static LOGGER: Logger;

  private _metricManager: MetricManager;
  private _storageManager: StorageManager;
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

  constructor(
    metricManager: MetricManager,
    storageManager: StorageManager,
    userInterface: UserInterface
  ) {
    ModuleManager.LOGGER = getLogger("ModuleManager");
    this._metricManager = metricManager;
    this._storageManager = storageManager;
    this._userInterface = userInterface;

    this._modules = new Map();
    this._tools = new Map();
    this._plugins = new Map();
    this._presets = new Map();

    this._toolsOfModule = new Map();
    this._pluginsOfModule = new Map();
    this._presetsOfModule = new Map();
  }

  get args() {
    return this._args;
  }

  set args(arguments_: Yargs.ArgumentsCamelCase) {
    this._args = arguments_;
    for (const module of this.modules.values()) {
      module.args = arguments_;
    }

    for (const tool of this.tools.values()) {
      tool.args = arguments_;
    }

    for (const pluginsOfType of this.plugins.values()) {
      for (const plugin of pluginsOfType.values()) {
        plugin.args = arguments_;
      }
    }

    for (const preset of this.presets.values()) {
      preset.args = arguments_;
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
      if (tool.getMetrics) {
        const toolMetrics = await tool.getMetrics();
        ModuleManager.LOGGER.info(
          `Tool ${tool.name} has ${toolMetrics.length} metrics: [${toolMetrics
            .map((metric) => Object.values(metric).join("."))
            .join(", ")}]`
        );
        metrics.push(...toolMetrics);
      }
    }

    for (const [pluginType, pluginsOfType] of this.plugins.entries()) {
      if (pluginType === PluginType.METRIC_MIDDLEWARE) {
        continue;
      }
      for (const plugin of pluginsOfType.values()) {
        if (plugin.getMetrics) {
          const pluginMetrics = await plugin.getMetrics();
          ModuleManager.LOGGER.info(
            `Plugin ${plugin.name} has ${
              pluginMetrics.length
            } metrics: [${pluginMetrics
              .map((metric) => Object.values(metric).join("."))
              .join(", ")}]`
          );
          metrics.push(...pluginMetrics);
        }
      }
    }

    if (!this.plugins.has(PluginType.METRIC_MIDDLEWARE)) {
      return metrics;
    }

    const metricMiddlewarePlugins = [
      ...this.plugins.get(PluginType.METRIC_MIDDLEWARE).values(),
    ];
    // sort based on pipeline
    const order = (<MetricOptions>(<unknown>this.args))
      .metricMiddlewarePipeline;

    metricMiddlewarePlugins.sort(
      (a, b) =>
        order.indexOf(`metric-middleware-${a.name}`) -
        order.indexOf(`metric-middleware-${b.name}`)
    );

    for (const plugin of metricMiddlewarePlugins) {
      // set previous metrics for this plugin
      (<MetricMiddlewarePlugin>plugin).setMetrics(metrics);

      if (plugin.getMetrics) {
        const pluginMetrics = await plugin.getMetrics();
        ModuleManager.LOGGER.info(
          `Metric Middleware Plugin ${plugin.name} has ${
            pluginMetrics.length
          } metrics: [${pluginMetrics
            .map((metric) => Object.values(metric).join("."))
            .join(", ")}]`
        );
        metrics.push(...pluginMetrics);
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
    ModuleManager.LOGGER.info("Running metric middleware pipeline");
    const metricPlugins = <MetricMiddlewarePlugin[]>[
      ...this.getPluginsOfType(PluginType.METRIC_MIDDLEWARE).values(),
    ];
    const order = (<MetricOptions>(<unknown>this.args))
      .metricMiddlewarePipeline;
    metricPlugins.sort(
      (a, b) =>
        order.indexOf(`metric-middleware-${a.name}`) -
        order.indexOf(`metric-middleware-${b.name}`)
    );

    const metricMiddleWare = metricPlugins.map((plugin) =>
      plugin.createMetricMiddleware(this._metricManager.metrics)
    );
    await this._metricManager.runPipeline(metricMiddleWare);

    ModuleManager.LOGGER.info("Cleaning up modules");
    for (const module of this.modules.values()) {
      if (module.cleanup) {
        ModuleManager.LOGGER.info(`Cleaning up module: ${module.name}`);
        await module.cleanup();
        ModuleManager.LOGGER.info(`Module cleaned up: ${module.name}`);
      }
    }
  }

  getModulePath(module: string): string {
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { module } = await import(modulePath);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

    this._modules.set(moduleInstance.name, moduleInstance);
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
        const modulePath = this.getModulePath(module);
        await this.loadModule(module, modulePath);
      } catch (error) {
        console.log(error);
        throw new Error(moduleCannotBeLoaded(module));
      }
    }

    const modules = [...this.modules.values()];
    for (const module of this._modules.values()) {
      await module.register(
        this,
        this._metricManager,
        this._storageManager,
        this._userInterface,
        modules
      );
    }
  }

  registerPreset(module: Module, preset: Preset) {
    if (this._presets.has(preset.name)) {
      throw new Error(presetAlreadyLoaded(preset.name));
    }

    ModuleManager.LOGGER.info(`Preset loaded: ${preset.name}`);
    this._presets.set(preset.name, preset);
    this._presetsOfModule.get(module.name).push(preset);
  }

  registerTool(module: Module, tool: Tool) {
    if (this._tools.has(tool.name)) {
      throw new Error(toolAlreadyLoaded(tool.name));
    }

    ModuleManager.LOGGER.info(`Tool loaded: ${tool.name}`);
    this._tools.set(tool.name, tool);
    this._toolsOfModule.get(module.name).push(tool);
  }

  registerPlugin(module: Module, plugin: Plugin) {
    if (!this._plugins.has(plugin.type)) {
      this._plugins.set(plugin.type, new Map());
    }

    if (this._plugins.get(plugin.type).has(plugin.name)) {
      throw new Error(pluginAlreadyLoaded(plugin.name, plugin.type));
    }

    ModuleManager.LOGGER.info(
      `- Plugin loaded: ${plugin.type} - ${plugin.name}`
    );
    this._plugins.get(plugin.type).set(plugin.name, plugin);
    this._pluginsOfModule.get(module.name).push(plugin);
  }

  configureModules(yargs: Yargs.Argv, presetChoice: string) {
    ModuleManager.LOGGER.info("Configuring modules");

    const presetOptions = [...this._presets.values()].map(
      (preset) => preset.name
    );
    // add presets options to yargs by overriding it
    yargs.option("preset", {
      alias: [],
      choices: ["none", ...presetOptions],
      default: "none",
      description: "The preset you want to use",
      group: OptionGroups.General,
      hidden: false,
      type: "string",
    });

    const plugins: Plugin[] = [];
    for (const pluginsOfType of this._plugins.values()) {
      for (const plugin of pluginsOfType.values()) {
        plugins.push(plugin);
      }
    }

    for (const tool of this._tools.values()) {
      tool.addPluginOptions(plugins);
      tool.addPluginOptionChoices(plugins);
      yargs = yargs.command(tool);
    }

    ModuleManager.LOGGER.info("Setting preset");
    if (presetChoice === "none") {
      ModuleManager.LOGGER.info("No preset set");
      return yargs;
    }

    ModuleManager.LOGGER.info(`Preset set: ${presetChoice}`);
    if (!this._presets.has(presetChoice)) {
      ModuleManager.LOGGER.error(`Preset not found: ${presetChoice}`);
      throw new Error(presetNotFound(presetChoice));
    }

    const presetObject = this._presets.get(presetChoice);
    yargs = yargs.middleware((arguments_) =>
      presetObject.modifyArgs(arguments_)
    );

    return yargs;
  }

  printModuleVersionTable() {
    const itemization: ItemizationItem[] = [];
    for (const module of this._modules.values()) {
      const tools = this._toolsOfModule.get(module.name);
      const plugins = this._pluginsOfModule.get(module.name);
      const presets = this._presetsOfModule.get(module.name);

      itemization.push({
        text: `Module: ${module.name} (${module.version})`,
        subItems: [
          {
            text: `Tools: ${tools.length > 0 ? "" : "[]"}`,
            subItems: tools.map((tool) => ({
              text: `${tool.name}: ${tool.describe}`,
            })),
          },
          {
            text: `Plugins: ${plugins.length > 0 ? "" : "[]"}`,
            subItems: plugins.map((plugin) => ({
              text: `${plugin.name}: ${plugin.describe}`,
            })),
          },
          {
            text: `Presets: ${presets.length > 0 ? "" : "[]"}`,
            subItems: presets.map((preset) => ({
              text: `${preset.name}: ${preset.describe}`,
            })),
          },
        ],
      });
    }

    this._userInterface.printItemization("Module loaded:", itemization);
  }
}
