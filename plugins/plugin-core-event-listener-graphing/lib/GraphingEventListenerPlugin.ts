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

import * as path from "node:path";

import { Events, RootContext } from "@syntest/analysis";
import { ControlFlowProgram } from "@syntest/cfg";
import { EventListenerPlugin } from "@syntest/module";
import { StorageManager } from "@syntest/storage";
import TypedEventEmitter from "typed-emitter";
import Yargs = require("yargs");

import { createSimulation } from "./D3Simulation";

export type GraphOptions = {
  graphingCfgDirectory: string;
};

/**
 * This graphing plugin creates a listener that creates an SVG based on the generated CFG.
 *
 * @author Dimitri Stallenberg
 */
export class GraphingEventListenerPlugin extends EventListenerPlugin {
  private storageManager: StorageManager;
  constructor(storageManager: StorageManager) {
    super(
      "graphing",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires, unicorn/prefer-module, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").description
    );
    this.storageManager = storageManager;
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "controlFlowGraphResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      <S>(
        rootContext: RootContext<S>,
        filePath: string,
        cfp: ControlFlowProgram
      ) => this.controlFlowGraphResolvingComplete(rootContext, filePath, cfp)
    );
  }

  override getOptions(
    tool: string,
    labels: string[],
    command: string
  ): Map<string, Yargs.Options> {
    const optionsMap = new Map<string, Yargs.Options>();

    if (!labels.includes("testing")) {
      return optionsMap;
    }

    if (command !== "test") {
      return optionsMap;
    }

    optionsMap.set("cfg-directory", {
      alias: [],
      default: "cfg",
      description: "The path where the csv should be saved",
      group: OptionGroups.Graphing,
      hidden: false,
      normalize: true,
      type: "string",
    });

    return optionsMap;
  }

  override getOptionChoices(): string[] {
    return [];
  }

  controlFlowGraphResolvingComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    cfp: ControlFlowProgram
  ): void {
    const name = path.basename(filePath, path.extname(filePath));
    const svgHtml = createSimulation(cfp.graph);

    const base = (<GraphOptions>(<unknown>this.args)).graphingCfgDirectory;

    this.storageManager.store([base, name], "_full.svg", svgHtml);

    for (const function_ of cfp.functions) {
      const svgHtml = createSimulation(function_.graph);

      this.storageManager.store([base, name], `${function_.name}.svg`, svgHtml);
    }
  }
}

export enum OptionGroups {
  Graphing = "Graphing Options:",
}
