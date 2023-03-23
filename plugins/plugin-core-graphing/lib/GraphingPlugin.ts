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

import { CONFIG } from "@syntest/base-testing-tool";
import { ControlFlowGraph } from "@syntest/cfg-core";
import { Events, RootContext } from "@syntest/core";
import { ListenerPlugin } from "@syntest/module";
import { writeFileSync } from "fs";
import TypedEventEmitter from "typed-emitter";
import Yargs = require("yargs");
import { createSimulation } from "./D3Simulation";

export type GraphOptions = {
  cfgDirectory: string;
};

/**
 * This graphing plugin creates a listener that creates an SVG based on the generated CFG.
 *
 * @author Dimitri Stallenberg
 */
export class GraphingPlugin extends ListenerPlugin {
  constructor() {
    super("Graphing", "Creates a graph of the CFG");
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "controlFlowGraphResolvingComplete",
      this.controlFlowGraphResolvingComplete
    );
  }

  async getCommandOptions(
    tool: string,
    labels: string[],
    command: string
  ): Promise<Map<string, Yargs.Options>> {
    if (!labels.includes("testing")) {
      return;
    }

    if (command !== "test") {
      return;
    }

    const optionsMap = new Map<string, Yargs.Options>();

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

  controlFlowGraphResolvingComplete<S>(
    rootContext: RootContext,
    cfg: ControlFlowGraph<S>
  ): void {
    const svgHtml = createSimulation(cfg);

    const base = (<GraphOptions>(<unknown>CONFIG)).cfgDirectory;
    const path = `${base}/test.svg`;
    writeFileSync(path, svgHtml);
  }
}

export enum OptionGroups {
  Graphing = "Graphing Options:",
}
