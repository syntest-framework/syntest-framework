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
import { Metric } from "@syntest/metric";
import Yargs = require("yargs");

import { Extension } from "./Extension";

export abstract class Plugin extends Extension {
  public type: Readonly<string>;
  public describe: Readonly<string>;

  constructor(type: string, name: string, describe: string) {
    super(name);
    this.type = type;
    this.describe = describe;
  }

  /**
   *
   * @param tool the tool the plugin provides options for
   * @param command the command the tool provides options for
   * Should return a map of command -> yargsConfig
   */
  abstract getOptions(
    tool: string,
    labels: string[],
    command?: string | undefined
  ): Map<string, Yargs.Options>;

  /**
   *
   * @param tool the tool the plugin provides additional choices for
   * @param option the option the plugin provides additional choices for
   */
  abstract getOptionChoices(
    option: string,
    tool: string,
    labels: string[],
    command?: string | undefined
  ): string[];
}

/**
 * We have defined both an abstract class and interface called Plugin here.
 * This is called 'merging' it allows an abstract class to have optional methods.
 */
export interface Plugin {
  /**
   * Should return a list of metrics that are stored by this plugin
   */
  getMetrics?(): Promise<Metric[]> | Metric[];
}
