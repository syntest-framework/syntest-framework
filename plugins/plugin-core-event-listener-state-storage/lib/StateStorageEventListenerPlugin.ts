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

import * as path from "node:path";

import { Events, RootContext, Target } from "@syntest/analysis";
import { ControlFlowProgram } from "@syntest/cfg";
import { EventListenerPlugin } from "@syntest/module";
import TypedEventEmitter from "typed-emitter";
import Yargs = require("yargs");

import { StateStorage } from "./StateStorage";

export type StateStorageOptions = {
  stateStorageDirectory: string;
};

/**
 * This graphing plugin creates a listener that creates an SVG based on the generated CFG.
 *
 * @author Dimitri Stallenberg
 */
export class StateStorageEventListenerPlugin extends EventListenerPlugin {
  constructor() {
    super(
      "state-storage",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires, unicorn/prefer-module, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").description
    );
  }

  setupEventListener(): void {
    const syntestPath = (<{ syntestDirectory: string }>(<unknown>this.args))
      .syntestDirectory;
    const stateStore = (<StateStorageOptions>(<unknown>this.args))
      .stateStorageDirectory;

    const base = path.join(syntestPath, stateStore);

    const stateStorage = new StateStorage(base);
    (<TypedEventEmitter<Events>>process).on(
      "controlFlowGraphResolvingComplete",
      <S>(
        rootContext: RootContext<S>,
        filePath: string,
        cfp: ControlFlowProgram
      ) =>
        stateStorage.controlFlowGraphResolvingComplete(
          rootContext,
          filePath,
          cfp
        )
    );
    (<TypedEventEmitter<Events>>process).on(
      "abstractSyntaxTreeResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      <S>(rootContext: RootContext<S>, filePath: string, ast: S) =>
        stateStorage.abstractSyntaxTreeResolvingComplete(
          rootContext,
          filePath,
          ast
        )
    );
    (<TypedEventEmitter<Events>>process).on(
      "targetExtractionComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      <S>(rootContext: RootContext<S>, filePath: string, target: Target) =>
        stateStorage.targetExtractionComplete(rootContext, filePath, target)
    );
    (<TypedEventEmitter<Events>>process).on(
      "dependencyResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      <S>(
        rootContext: RootContext<S>,
        filePath: string,
        dependencies: string[]
      ) =>
        stateStorage.dependencyResolvingComplete(
          rootContext,
          filePath,
          dependencies
        )
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

    optionsMap.set("directory", {
      alias: [],
      default: "state",
      description: "The path where the state should be saved",
      group: OptionGroups.StateStorage,
      hidden: false,
      normalize: true,
      type: "string",
    });

    return optionsMap;
  }

  override getOptionChoices(): string[] {
    return [];
  }
}

export enum OptionGroups {
  StateStorage = "State Storage Options:",
}
