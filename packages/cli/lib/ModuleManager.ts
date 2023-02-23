/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core Graphing Plugin.
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
import shell = require("shelljs");
import globalModules = require("global-modules");
import Yargs = require("yargs");
import { PluginInterface } from "./moduleInterfaces/PluginInterface";
import {
  pluginAlreadyRegistered,
  pluginNotFound,
  pluginsNotFound,
} from "./util/diagnostics";
import { ApplicationInterface } from "./moduleInterfaces/ApplicationInterface";

export class ModuleManager {
  static instance: ModuleManager;

  static initializeModuleManager() {
    this.instance = new ModuleManager();
  }

  private _applications: Map<string, ApplicationInterface>;
  // type -> name -> plugin
  private _plugins: Map<string, Map<string, PluginInterface>>;

  constructor() {
    this._applications = new Map();
    this._plugins = new Map();
  }

  get plugins() {
    return this._plugins;
  }

  getPlugin(type: string, name: string) {
    if (!this._plugins.has(type)) {
      throw new Error(pluginNotFound(name, type));
    }

    if (!this._plugins.get(type).has(name)) {
      throw new Error(pluginNotFound(name, type));
    }

    return this._plugins.get(type).get(name);
  }

  getPluginsOfType(type: string) {
    if (!this._plugins.has(type)) {
      throw new Error(pluginsNotFound(type));
    }

    return this._plugins.get(type);
  }

  async prepare() {
    for (const application of this._applications.values()) {
      if (application.prepare) {
        await application.prepare();
      }
    }

    for (const plugins of this.plugins.values()) {
      for (const plugin of plugins.values()) {
        if (plugin.prepare) {
          await plugin.prepare();
        }
      }
    }
  }

  async cleanup() {
    for (const application of this._applications.values()) {
      if (application.cleanup) {
        await application.cleanup();
      }
    }

    for (const plugins of this.plugins.values()) {
      for (const plugin of plugins.values()) {
        if (plugin.cleanup) {
          await plugin.cleanup();
        }
      }
    }
  }

  async configureApplicationCommands(yargs: Yargs.Argv) {
    for (const application of this._applications.values()) {
      const commandModules = await application.getCommandModules();
      for (const commandModule of commandModules) {
        // check requirements
        if (!commandModule.command) {
          throw new Error("SynTest command module required command property!");
        } else if (!commandModule.describe) {
          throw new Error("SynTest command module required describe property!");
        } else if (!commandModule.handler) {
          throw new Error("SynTest command module required handler function!");
        }
        yargs = yargs.command(commandModule);
      }
    }

    return yargs;
  }

  async configurePluginOptions(yargs: Yargs.Argv) {
    for (const plugins of this.plugins.values()) {
      for (const plugin of plugins.values()) {
        if (plugin.getOptions) {
          const options = await plugin.getOptions();

          for (const option of options.keys()) {
            yargs = yargs.option(`${plugin.name}-${option}`, {
              ...options.get(option),
              group: `${plugin.name} ${options.get(option).group || ""}`,
            });
          }
        }
      }
    }
    return yargs;
  }

  async getModulePath(module: string): Promise<string> {
    let modulePath = "";

    if (module.startsWith("file:")) {
      // It is a file path
      modulePath = path.resolve(module.replace("file:", ""));
      if (!shell.test("-e", modulePath)) {
        throw new Error(`Filepath does not lead to an module, path: ${module}`);
      }
    } else {
      // It is a npm package
      modulePath = path.resolve(path.join("node_modules", module));

      if (!shell.test("-e", modulePath)) {
        // it is not locally installed lets try global
        modulePath = path.resolve(path.join(globalModules, module));
      }

      if (!shell.test("-e", modulePath)) {
        // it is not installed locally nor globally
        // TODO maybe auto install?
        throw new Error(
          `Package is not installed locally or globally, package: ${module}`
        );
      }
    }

    return modulePath;
  }

  async loadApplication(application: string) {
    const modulePath = await this.getModulePath(application);
    const { syntestApplication } = await import(modulePath);
    const applicationInstance: ApplicationInterface =
      new syntestApplication.default();

    // check requirements
    if (!applicationInstance.getCommandModules) {
      throw new Error("SynTest application module required command property!");
    }

    this._applications.set(application, applicationInstance);
  }

  async loadApplications(applications: string[]) {
    for (const app of applications) {
      try {
        await this.loadApplication(app);
      } catch (e) {
        console.log(e);
        throw new Error(`Failed to load application: ${app}`);
      }
    }
  }

  async loadPlugin(plugin: string) {
    const modulePath = await this.getModulePath(plugin);

    const { syntestPlugin } = await import(modulePath);
    const pluginInstance: PluginInterface = new syntestPlugin.default();

    if (!this._plugins.has(pluginInstance.type)) {
      this._plugins.set(pluginInstance.type, new Map());
    }

    if (this._plugins.get(pluginInstance.type).has(plugin)) {
      throw new Error(pluginAlreadyRegistered(plugin, pluginInstance.type));
    }

    this._plugins.get(pluginInstance.type).set(plugin, pluginInstance);
  }

  async loadPlugins(plugins: string[]) {
    for (const plugin of plugins) {
      try {
        await this.loadPlugin(plugin);
      } catch (e) {
        console.log(e);
        throw new Error(`Failed to load plugin: ${plugin}`);
      }
    }
  }
}
