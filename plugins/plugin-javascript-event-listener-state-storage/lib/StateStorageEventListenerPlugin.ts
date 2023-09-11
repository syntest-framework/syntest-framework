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

import { Events, RootContext } from "@syntest/analysis-javascript";
import { EventListenerPlugin } from "@syntest/module";
import { StorageManager } from "@syntest/storage";
import TypedEventEmitter from "typed-emitter";
import Yargs = require("yargs");

import { StateStorage } from "./StateStorage";

export type StateStorageOptions = {
  javascriptStateStorageDirectory: string;
};

/**
 * This graphing plugin creates a listener that creates an SVG based on the generated CFG.
 *
 * @author Dimitri Stallenberg
 */
export class StateStorageEventListenerPlugin extends EventListenerPlugin {
  private storageManager: StorageManager;

  constructor(storageManager: StorageManager) {
    super(
      "javascript-state-storage",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires, unicorn/prefer-module, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").description
    );
    this.storageManager = storageManager;
  }

  setupEventListener(): void {
    const stateStore = (<StateStorageOptions>(<unknown>this.args))
      .javascriptStateStorageDirectory;

    const stateStorage = new StateStorage(this.storageManager, stateStore);

    (<TypedEventEmitter<Events>>process).on(
      "exportExtractionComplete",
      (rootContext: RootContext, filepath: string) =>
        stateStorage.exportExtractionComplete(rootContext, filepath)
    );

    (<TypedEventEmitter<Events>>process).on(
      "elementExtractionComplete",
      (rootContext: RootContext, filepath: string) =>
        stateStorage.elementExtractionComplete(rootContext, filepath)
    );

    (<TypedEventEmitter<Events>>process).on(
      "relationExtractionComplete",
      (rootContext: RootContext, filepath: string) =>
        stateStorage.relationExtractionComplete(rootContext, filepath)
    );

    (<TypedEventEmitter<Events>>process).on(
      "objectTypeExtractionComplete",
      (rootContext: RootContext, filepath: string) =>
        stateStorage.objectTypeExtractionComplete(rootContext, filepath)
    );

    (<TypedEventEmitter<Events>>process).on(
      "typeResolvingComplete",
      (rootContext: RootContext) =>
        stateStorage.typeResolvingComplete(rootContext)
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
