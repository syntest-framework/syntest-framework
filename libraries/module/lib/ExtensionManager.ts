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

import { UserInterface } from "@syntest/cli-graphics";
import { getLogger, Logger } from "@syntest/logging";
import { Metric, MetricManager } from "@syntest/metric";
import { StorageManager } from "@syntest/storage";
import Yargs = require("yargs");

import { ExtensionAPI, ExtensionRegistrationAPI } from "./extension/Extension";
import { Module } from "./extension/Module";
import { Plugin } from "./extension/Plugin";
import { MetricMiddlewarePlugin } from "./extension/plugins/MetricMiddlewarePlugin";
import { PluginType } from "./extension/plugins/PluginType";
import { Preset } from "./extension/Preset";
import { Tool } from "./extension/Tool";
import {
  pluginAlreadyLoaded,
  pluginNotFound,
  presetAlreadyLoaded,
  presetNotFound,
  toolAlreadyLoaded,
} from "./util/diagnostics";

export class ExtensionManager {
  protected static LOGGER: Logger;

  private _modules: Map<string, Module>;
  private _tools: Map<string, Tool>;

  // type -> name -> plugin
  private _plugins: Map<string, Map<string, Plugin>>;
  private _presets: Map<string, Preset>;

  private _toolsOfModule: Map<string, Tool[]>;
  private _pluginsOfModule: Map<string, Plugin[]>;
  private _presetsOfModule: Map<string, Preset[]>;

  constructor() {
    ExtensionManager.LOGGER = getLogger("ModuleManager");

    this._modules = new Map();
    this._tools = new Map();
    this._plugins = new Map();
    this._presets = new Map();

    this._toolsOfModule = new Map();
    this._pluginsOfModule = new Map();
    this._presetsOfModule = new Map();
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
        ExtensionManager.LOGGER.info(
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
          ExtensionManager.LOGGER.info(
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
    // const order = this.args["metricMiddlewarePipeline"];

    // metricMiddlewarePlugins.sort(
    //   (a, b) =>
    //     (<string[]>order).indexOf(`metric-middleware-${a.name}`) -
    //     (<string[]>order).indexOf(`metric-middleware-${b.name}`)
    // );

    for (const plugin of metricMiddlewarePlugins) {
      // set previous metrics for this plugin
      (<MetricMiddlewarePlugin>plugin).setMetrics(metrics);

      if (plugin.getMetrics) {
        const pluginMetrics = await plugin.getMetrics();
        ExtensionManager.LOGGER.info(
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

  public async prepare() {
    ExtensionManager.LOGGER.info("Preparing modules");
    for (const pluginType of this.plugins.values()) {
      for (const plugin of pluginType.values()) {
        if (plugin.prepare) {
          ExtensionManager.LOGGER.info(`Preparing plugin: ${plugin.name}`);
          await plugin.prepare();
          ExtensionManager.LOGGER.info(`Plugin prepared: ${plugin.name}`);
        }
      }
    }
  }

  public async cleanup() {
    ExtensionManager.LOGGER.info("Running metric middleware pipeline");
    // const metricPlugins = <MetricMiddlewarePlugin[]>[
    //   ...this.getPluginsOfType(PluginType.METRIC_MIDDLEWARE).values(),
    // ];
    //const order = this.args["metricMiddlewarePipeline"];
    // metricPlugins.sort(
    //   (a, b) =>
    //     (<string[]>order).indexOf(`metric-middleware-${a.name}`) -
    //     (<string[]>order).indexOf(`metric-middleware-${b.name}`)
    // );

    // const metricMiddleWare = metricPlugins.map((plugin) =>
    //   plugin.createMetricMiddleware(this._metricManager.metrics)
    // );
    //await this._metricManager.runPipeline(metricMiddleWare);

    ExtensionManager.LOGGER.info("Cleaning up plugins");
    for (const pluginType of this.plugins.values()) {
      for (const plugin of pluginType.values()) {
        if (plugin.cleanup) {
          ExtensionManager.LOGGER.info(`Cleaning up plugin: ${plugin.name}`);
          await plugin.cleanup();
          ExtensionManager.LOGGER.info(`Plugin cleaned up: ${plugin.name}`);
        }
      }
    }
  }

  createRegistrationAPI(module: Module): ExtensionRegistrationAPI {
    const api: ExtensionRegistrationAPI = {
      registerPreset: (preset: Preset) => this.registerPreset(preset, module),
      registerTool: (tool: Tool) => this.registerTool(tool, module),
      registerPlugin: (plugin: Plugin) => this.registerPlugin(plugin, module),
    };
    return api;
  }

  registerModule(module: Module) {
    if (this._modules.has(module.name)) {
      throw new Error(`Module already loaded: ${module.name}`);
    }

    ExtensionManager.LOGGER.info(`Module loaded: ${module.name}`);
    this._modules.set(module.name, module);
    this._toolsOfModule.set(module.name, []);
    this._pluginsOfModule.set(module.name, []);
    this._presetsOfModule.set(module.name, []);
  }

  registerPreset(preset: Preset, module?: Module) {
    if (this._presets.has(preset.name)) {
      throw new Error(presetAlreadyLoaded(preset.name));
    }

    ExtensionManager.LOGGER.info(`Preset loaded: ${preset.name}`);
    this._presets.set(preset.name, preset);
    this._presetsOfModule.get(module.name).push(preset);
  }

  registerTool(tool: Tool, module?: Module) {
    if (this._tools.has(tool.name)) {
      throw new Error(toolAlreadyLoaded(tool.name));
    }

    ExtensionManager.LOGGER.info(`Tool loaded: ${tool.name}`);
    this._tools.set(tool.name, tool);
    this._toolsOfModule.get(module.name).push(tool);
  }

  registerPlugin(plugin: Plugin, module?: Module) {
    if (!this._plugins.has(plugin.type)) {
      this._plugins.set(plugin.type, new Map());
    }

    if (this._plugins.get(plugin.type).has(plugin.name)) {
      throw new Error(pluginAlreadyLoaded(plugin.name, plugin.type));
    }

    ExtensionManager.LOGGER.info(
      `- Plugin loaded: ${plugin.type} - ${plugin.name}`
    );
    this._plugins.get(plugin.type).set(plugin.name, plugin);
    this._pluginsOfModule.get(module.name).push(plugin);
  }

  async setup(
    config: unknown,
    metricManager: MetricManager,
    userInterface: UserInterface,
    storageManager: StorageManager
  ) {
    const api: ExtensionAPI = {
      config: config,
      extensionManager: this,
      metricManager: metricManager,
      storageManager: storageManager,
      userInterface: userInterface,
    };

    for (const pluginType of this.plugins.values()) {
      for (const plugin of pluginType.values()) {
        if (plugin.setup) {
          ExtensionManager.LOGGER.info(`Setting up plugin: ${plugin.name}`);
          await plugin.setup(api);
          ExtensionManager.LOGGER.info(`Plugin set up: ${plugin.name}`);
        }
      }
    }
  }

  configureModules(yargs: Yargs.Argv, presetChoice: string) {
    ExtensionManager.LOGGER.info("Configuring modules");

    const presetOptions = [...this._presets.values()].map(
      (preset) => preset.name
    );
    // add presets options to yargs by overriding it
    yargs.option("preset", {
      alias: [],
      choices: ["none", ...presetOptions],
      default: "none",
      description: "The preset you want to use",
      group: "General Options:",
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

    ExtensionManager.LOGGER.info("Setting preset");
    if (presetChoice === "none") {
      ExtensionManager.LOGGER.info("No preset set");
      return yargs;
    }

    ExtensionManager.LOGGER.info(`Preset set: ${presetChoice}`);
    if (!this._presets.has(presetChoice)) {
      ExtensionManager.LOGGER.error(`Preset not found: ${presetChoice}`);
      throw new Error(presetNotFound(presetChoice));
    }

    const presetObject = this._presets.get(presetChoice);
    yargs = yargs.middleware(
      (arguments_) => presetObject.modifyArgs(arguments_),
      true
    );

    return yargs;
  }

  // printModuleVersionTable() {
  //   const itemization: ItemizationItem[] = [];
  //   for (const module of this._modules.values()) {
  //     const tools = this._toolsOfModule.get(module.name);
  //     const plugins = this._pluginsOfModule.get(module.name);
  //     const presets = this._presetsOfModule.get(module.name);

  //     itemization.push({
  //       text: `Module: ${module.name} (${module.version})`,
  //       subItems: [
  //         {
  //           text: `Tools: ${tools.length > 0 ? "" : "[]"}`,
  //           subItems: tools.map((tool) => ({
  //             text: `${tool.name}: ${tool.describe}`,
  //           })),
  //         },
  //         {
  //           text: `Plugins: ${plugins.length > 0 ? "" : "[]"}`,
  //           subItems: plugins.map((plugin) => ({
  //             text: `${plugin.name}: ${plugin.describe}`,
  //           })),
  //         },
  //         {
  //           text: `Presets: ${presets.length > 0 ? "" : "[]"}`,
  //           subItems: presets.map((preset) => ({
  //             text: `${preset.name}: ${preset.description}`,
  //           })),
  //         },
  //       ],
  //     });
  //   }

  //   this._userInterface.printItemization("Module loaded:", itemization);
  // }
}
