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
import { Metric } from "@syntest/metric";
import Yargs = require("yargs");

import { cannotAddChoicesToOptionWithoutChoices } from "../util/diagnostics";

import { Command } from "./Command";
import { Extension } from "./Extension";
import { Plugin } from "./Plugin";

export class Tool extends Extension implements Yargs.CommandModule {
  labels: string[];
  command: Readonly<string>;

  commands: Command[];
  toolOptions: Map<string, Yargs.Options>;

  handler: (arguments_: Yargs.ArgumentsCamelCase) => void | Promise<void>;
  describe: string;

  constructor(
    name: string,
    labels: string[],
    describe: string,
    commands: Command[],
    toolOptions: Map<string, Yargs.Options>,
    handler?: (arguments_: Yargs.ArgumentsCamelCase) => void | Promise<void>
  ) {
    super(name);
    this.labels = labels;
    this.describe = describe;
    this.command = name;
    this.commands = commands;
    this.toolOptions = toolOptions;
    this.handler = handler;
  }

  async addPluginOptions(plugins: Plugin[]): Promise<void> {
    for (const plugin of plugins) {
      if (plugin.getToolOptions) {
        const toolOptions = await plugin.getToolOptions(this.name, this.labels);

        for (const option of toolOptions.keys()) {
          this.toolOptions.set(
            `${plugin.name}-${option}`,
            toolOptions.get(option)
          );
        }
      }

      if (!plugin.getCommandOptions) {
        continue;
      }

      await this.addCommandOptions(plugin);
    }

    /**
     * These two loops are separated because we need to be able to add choices to options that are added by plugins.
     * If the two loops are combined, the choices will be added to the original options, not the options added by plugins.
     */
    await this.addPluginOptionChoices(plugins);
  }

  async addCommandOptions(plugin: Plugin): Promise<void> {
    for (const command of this.commands) {
      const commandOptions = await plugin.getCommandOptions(
        this.name,
        this.labels,
        command.command
      );

      for (const option of commandOptions.keys()) {
        command.options.set(
          `${plugin.name}-${option}`,
          commandOptions.get(option)
        );
      }
    }
  }

  async addPluginOptionChoices(plugins: Plugin[]): Promise<void> {
    for (const plugin of plugins) {
      if (plugin.getToolOptionChoices) {
        for (const option of this.toolOptions.keys()) {
          const addedChoices = await plugin.getToolOptionChoices(
            this.name,
            this.labels,
            option
          );

          if (!this.toolOptions.get(option).choices) {
            throw new Error(
              cannotAddChoicesToOptionWithoutChoices(option, plugin.name)
            );
          }

          this.toolOptions.get(option).choices = [
            ...this.toolOptions.get(option).choices,
            ...addedChoices,
          ];
        }
      }

      if (!plugin.getCommandOptionChoices) {
        continue;
      }

      await this.addCommandOptionChoices(plugin);
    }
  }

  async addCommandOptionChoices(plugin: Plugin): Promise<void> {
    for (const command of this.commands) {
      for (const option of Object.keys(command.options)) {
        const addedChoices = await plugin.getCommandOptionChoices(
          this.name,
          this.labels,
          command.command,
          option
        );

        if (!command.options.get(option).choices) {
          throw new Error(
            cannotAddChoicesToOptionWithoutChoices(option, plugin.name)
          );
        }

        command.options.get(option).choices = [
          ...command.options.get(option).choices,
          ...addedChoices,
        ];
      }
    }
  }

  builder = (yargs: Yargs.Argv) => {
    // add all subcommands
    for (const command of this.commands) {
      yargs = yargs.command(command);
    }

    for (const option of this.toolOptions.keys()) {
      yargs = yargs.option(option, this.toolOptions.get(option));
    }

    // if no handler is provided, demand a subcommand
    if (!this.handler) {
      yargs = yargs.demandCommand();
    }

    return yargs.usage(`Usage: $0 ${this.command} <command> [options]`);
  };
}

export interface Tool {
  /**
   * Should return a list of metrics that are stored by this tool
   */
  getMetrics?(): Promise<Metric[]> | Metric[];
}
