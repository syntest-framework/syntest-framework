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

import Yargs = require("yargs");

import { Command } from "../extension/Command";
import { Plugin } from "../extension/Plugin";
import { Tool } from "../extension/Tool";
import { ModuleManager } from "../ModuleManager";

const manualRequired = "TODO fill this in yourself";

// const camelize = (s: string) => s.replace(/-./g, x=>x[1].toUpperCase())
const kebabize = (s: string) =>
  s.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? "-" : "") + $.toLowerCase()
  );

function addCommandOptions(
  options: { [key: string]: unknown },
  tool: Tool,
  command: Command,
  moduleManager: ModuleManager
) {
  for (const [name, option] of command.options.entries()) {
    options[kebabize(name)] =
      option.default === undefined ? manualRequired : option.default;
  }

  for (const pluginsOfType of moduleManager.plugins.values()) {
    for (const plugin of pluginsOfType.values()) {
      addPluginOptions(options, tool, command, plugin);
    }
  }
}

function addPluginOptions(
  options: { [key: string]: unknown },
  tool: Tool,
  command: Command,
  plugin: Plugin
) {
  const toolOptions = plugin.getOptions(tool.name, tool.labels);

  for (const [name, option] of toolOptions.entries()) {
    options[kebabize(name)] =
      option.default === undefined ? manualRequired : option.default;
  }

  const commandOptions = plugin.getOptions(
    tool.name,
    tool.labels,
    command.command
  );
  for (const [name, option] of commandOptions.entries()) {
    options[kebabize(name)] =
      option.default === undefined ? manualRequired : option.default;
  }
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function extractArgumentValues(
  arguments_: Yargs.ArgumentsCamelCase,
  moduleManager: ModuleManager
) {
  const allOptions: { [key: string]: unknown } = {};

  // Set default values for each option provided by the modules
  for (const tool of moduleManager.tools.values()) {
    for (const [name, option] of tool.toolOptions.entries()) {
      allOptions[kebabize(name)] =
        option.default === undefined ? manualRequired : option.default;
    }

    for (const command of tool.commands) {
      addCommandOptions(allOptions, tool, command, moduleManager);
    }
  }

  // Set the values provided by the user
  for (const argument of Object.keys(arguments_)) {
    if (
      /[A-Z]/.test(argument) ||
      argument.includes("_") ||
      argument.length === 1 ||
      argument === "help" ||
      argument === "version" ||
      argument === "$0" ||
      argument === "_"
    ) {
      continue;
    }

    allOptions[kebabize(argument)] = arguments_[argument];
  }

  // do it a second time and replace the value of the kebab-case with the camelcase because camelcase often have the final value
  for (const argument of Object.keys(arguments_)) {
    if (
      argument.includes("_") ||
      argument.length === 1 ||
      argument === "help" ||
      argument === "version" ||
      argument === "$0" ||
      argument === "_"
    ) {
      continue;
    }

    if (/[A-Z]/.test(argument)) {
      allOptions[kebabize(argument)] = arguments_[argument];
    }
  }

  return allOptions;
}
