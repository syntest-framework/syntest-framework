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

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";

import { Events, RootContext, Target } from "@syntest/analysis";
import { ControlFlowProgram, makeSerializeable } from "@syntest/cfg";
import { EventListenerPlugin } from "@syntest/module";
import TypedEventEmitter from "typed-emitter";
import Yargs = require("yargs");

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
    (<TypedEventEmitter<Events>>process).on(
      "controlFlowGraphResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      <S>(
        rootContext: RootContext<S>,
        filePath: string,
        cfp: ControlFlowProgram
      ) => this.controlFlowGraphResolvingComplete(rootContext, filePath, cfp)
    );
    (<TypedEventEmitter<Events>>process).on(
      "abstractSyntaxTreeResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      <S>(rootContext: RootContext<S>, filePath: string, ast: S) =>
        this.abstractSyntaxTreeResolvingComplete(rootContext, filePath, ast)
    );
    (<TypedEventEmitter<Events>>process).on(
      "targetExtractionComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      <S>(rootContext: RootContext<S>, filePath: string, target: Target) =>
        this.targetExtractionComplete(rootContext, filePath, target)
    );
    (<TypedEventEmitter<Events>>process).on(
      "dependencyResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      <S>(
        rootContext: RootContext<S>,
        filePath: string,
        dependencies: string[]
      ) => this.dependencyResolvingComplete(rootContext, filePath, dependencies)
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

  controlFlowGraphResolvingComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    cfp: ControlFlowProgram
  ): void {
    this.save(
      // eslint-disable-next-line unicorn/no-null
      JSON.stringify(makeSerializeable(cfp), null, 2),
      filePath,
      "cfg.json"
    );
  }

  abstractSyntaxTreeResolvingComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    ast: S
  ): void {
    if (!filePath.includes("truncate")) {
      return;
    }
    this.save(JSON.stringify(ast), filePath, "ast.json");
  }

  targetExtractionComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    target: Target
  ): void {
    if (!filePath.includes("truncate")) {
      return;
    }
    this.save(JSON.stringify(target), filePath, "target.json");
  }

  dependencyResolvingComplete<S>(
    rootContext: RootContext<S>,
    filePath: string,
    dependencies: string[]
  ): void {
    if (!filePath.includes("truncate")) {
      return;
    }
    this.save(
      JSON.stringify({ depedencies: dependencies }),
      filePath,
      "dependencies.json"
    );
  }

  save(
    data: string,
    filePath: string,
    type: "cfg.json" | "ast.json" | "target.json" | "dependencies.json"
  ) {
    const name = path.basename(filePath, path.extname(filePath));

    const syntestPath = (<{ syntestDirectory: string }>(<unknown>this.args))
      .syntestDirectory;
    const stateStore = (<StateStorageOptions>(<unknown>this.args))
      .stateStorageDirectory;

    const base = path.join(syntestPath, stateStore);
    const directory = path.join(base, name);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    const savePath = path.join(directory, type);
    writeFileSync(savePath, data);
  }
}

export enum OptionGroups {
  StateStorage = "State Storage Options:",
}
