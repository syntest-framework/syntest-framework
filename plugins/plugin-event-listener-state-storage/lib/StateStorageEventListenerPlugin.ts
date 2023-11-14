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

import { Events, RootContext, Target } from "@syntest/analysis";
import { ControlFlowProgram } from "@syntest/cfg";
import { EventListenerPlugin } from "@syntest/module";
import {
  Encoding,
  SearchAlgorithm,
  Events as SearchEvents,
  SearchSubject,
} from "@syntest/search";
import { StorageManager } from "@syntest/storage";
import TypedEventEmitter from "typed-emitter";
import Yargs = require("yargs");

import { StateStorage } from "./StateStorage";

export type StateStorageOptions = {
  stateStorageDirectory: string;
};

/**
 * This graphing plugin creates a listener that creates an SVG based on the generated CFG.
 */
export class StateStorageEventListenerPlugin extends EventListenerPlugin {
  private storageManager: StorageManager;

  constructor(storageManager: StorageManager) {
    super(
      "state-storage",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires, unicorn/prefer-module, @typescript-eslint/no-unsafe-member-access
      require("../../package.json").description
    );
    this.storageManager = storageManager;
  }

  setupEventListener(): void {
    const stateStore = (<StateStorageOptions>(<unknown>this.args))
      .stateStorageDirectory;

    const stateStorage = new StateStorage(this.storageManager, stateStore);
    (<TypedEventEmitter<Events>>process).on(
      "controlFlowGraphResolvingComplete",
      <S>(
        rootContext: RootContext<S>,
        filepath: string,
        cfp: ControlFlowProgram
      ) =>
        stateStorage.controlFlowGraphResolvingComplete(
          rootContext,
          filepath,
          cfp
        )
    );
    (<TypedEventEmitter<Events>>process).on(
      "abstractSyntaxTreeResolvingComplete",
      <S>(rootContext: RootContext<S>, filepath: string, ast: S) =>
        stateStorage.abstractSyntaxTreeResolvingComplete(
          rootContext,
          filepath,
          ast
        )
    );
    (<TypedEventEmitter<Events>>process).on(
      "targetExtractionComplete",
      <S>(rootContext: RootContext<S>, filepath: string, target: Target) =>
        stateStorage.targetExtractionComplete(rootContext, filepath, target)
    );
    (<TypedEventEmitter<Events>>process).on(
      "dependencyResolvingComplete",
      <S>(
        rootContext: RootContext<S>,
        filepath: string,
        dependencies: string[]
      ) =>
        stateStorage.dependencyResolvingComplete(
          rootContext,
          filepath,
          dependencies
        )
    );

    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchComplete",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        subject: SearchSubject<E>
      ) => stateStorage.searchComplete(searchAlgorithm, subject)
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
