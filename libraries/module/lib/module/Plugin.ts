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
import Yargs = require("yargs");

export abstract class Plugin {
  public type: Readonly<string>;
  public name: Readonly<string>;
  public describe: Readonly<string>;

  constructor(type: string, name: string, describe: string) {
    this.type = type;
    this.name = name;
    this.describe = describe;
  }
}

/**
 * We have defined both an abstract class and interface called Plugin here.
 * This is called 'merging' it allows an abstract class to have optional methods.
 */
export interface Plugin {
  /**
   *
   * @param tool the tool the plugin provides options for
   * Should return a map of command -> yargsConfig
   */
  getToolOptions?(
    tool: string,
    labels: string[]
  ): Promise<Map<string, Yargs.Options>> | Map<string, Yargs.Options>;
  /**
   *
   * @param tool the tool the plugin provides additional choices for
   * @param option the option the plugin provides additional choices for
   */
  getToolOptionChoices?(
    tool: string,
    labels: string[],
    option: string
  ): Promise<string[]> | string[];

  /**
   * @param tool the tool the plugin provides options for
   * @param command the command the tool provides options for
   * Should return a map of command -> yargsConfig
   */
  getCommandOptions?(
    tool: string,
    labels: string[],
    command: string
  ): Promise<Map<string, Yargs.Options>> | Map<string, Yargs.Options>;

  /**
   *
   * @param tool the tool the plugin provides additional choices for
   * @param command the command the plugin provides additional choices for
   * @param option the option the plugin provides additional choices for
   */
  getCommandOptionChoices?(
    tool: string,
    labels: string[],
    command: string,
    option: string
  ): Promise<string[]> | string[];
}
