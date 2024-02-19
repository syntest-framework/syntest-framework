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
import { IllegalStateError } from "@syntest/diagnostics";
import { Metric } from "@syntest/metric";
import Yargs = require("yargs");

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

  /**
   * These two functions are separated because we need to be able to add choices to options that are added by plugins.
   * If the two functions are combined, the choices will be added to the original options, not the options added by plugins.
   */
  addPluginOptions(plugins: Plugin[]): void {
    for (const plugin of plugins) {
      const toolOptions = plugin.getOptions(this.name, this.labels);

      for (const option of toolOptions.keys()) {
        this.toolOptions.set(
          `${plugin.name}-${option}`,
          toolOptions.get(option)
        );
      }

      for (const command of this.commands) {
        const commandOptions = plugin.getOptions(
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
  }

  addPluginOptionChoices(plugins: Plugin[]): void {
    for (const plugin of plugins) {
      for (const option of this.toolOptions.keys()) {
        const addedChoices = plugin.getOptionChoices(
          option,
          this.name,
          this.labels
        );

        if (addedChoices.length === 0) {
          continue;
        }

        if (!this.toolOptions.get(option).choices) {
          throw new IllegalStateError(
            "Could not add choices to option as option does not have choices",
            {
              context: {
                option: option,
                plugin: plugin.name,
              },
            }
          );
        }
        const newOption = {
          ...this.toolOptions.get(option),
        };

        newOption.choices = [
          ...this.toolOptions.get(option).choices,
          ...addedChoices,
        ];

        this.toolOptions.set(option, newOption);
      }

      this._addCommandOptionChoices(plugin);
    }
  }

  protected _addCommandOptionChoices(plugin: Plugin): void {
    for (const command of this.commands) {
      for (const option of Object.keys(command.options)) {
        const addedChoices = plugin.getOptionChoices(
          option,
          this.name,
          this.labels,
          command.command
        );

        if (addedChoices.length === 0) {
          continue;
        }

        if (!command.options.get(option).choices) {
          throw new IllegalStateError(
            "Could not add choices to option as option does not have choices",
            {
              context: {
                option: option,
                plugin: plugin.name,
              },
            }
          );
        }

        command.options.get(option).choices = [
          ...command.options.get(option).choices,
          ...addedChoices,
        ];

        const newOption = {
          ...command.options.get(option),
        };

        newOption.choices = [
          ...command.options.get(option).choices,
          ...addedChoices,
        ];

        command.options.set(option, newOption);
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

  /**
   * Should return a list of metrics that are stored by this tool
   */
  getMetrics?(): Promise<Metric[]> | Metric[];
}
