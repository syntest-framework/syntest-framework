/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

import {
  Events as AnalysisEvents,
  RootContext,
  Target,
} from "@syntest/analysis";
import { Events as BaseLanguageEvents } from "@syntest/base-language";
import { ControlFlowProgram } from "@syntest/cfg";
import { getLogger, Logger } from "@syntest/logging";
import { EventListenerPlugin } from "@syntest/module";
import {
  BudgetManager,
  Encoding,
  SearchAlgorithm,
  Events as SearchEvents,
  SearchSubject,
  TerminationManager,
} from "@syntest/search";
import TypedEventEmitter from "typed-emitter";
import * as WebSocket from "ws";
import Yargs = require("yargs");

import { handler } from "./handlers/handler";
import { abstractSyntaxTreeModelFormatter } from "./models/AbstractSyntaxTreeModel";
import { controlFlowGraphModelFormatter } from "./models/ControlFlowGraphModel";
import { dependencyModelFormatter } from "./models/DependencyModel";
import { searchProgressModelFormatter as searchProgressFormatter } from "./models/SearchProgressModel";
import { sourceModelFormatter } from "./models/SourceModel";
import { targetModelFormatter } from "./models/TargetModel";

export type PublisherWSOptions = {
  wsUrl: string;
};

/**
 * This plugin publishes all of the SynTest's events to the specified url with WebSocket protocol.
 *
 * @author Yehor Kozyr
 */
export class WebsocketEventListenerPlugin extends EventListenerPlugin {
  private static LOGGER: Logger;
  private client: WebSocket;

  constructor() {
    super(
      "websocket",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires, unicorn/prefer-module
      require("../../package.json").description
    );
    WebsocketEventListenerPlugin.LOGGER = getLogger(
      "WebsocketEventListenerPlugin"
    );
  }

  async connect() {
    const url = (<PublisherWSOptions>(<unknown>this.args)).wsUrl;

    if (url === undefined) {
      WebsocketEventListenerPlugin.LOGGER.warn(
        `There was no websocket url provided to the websocket plugin. Skipping connection.`
      );
      return;
    }

    this.client = new WebSocket(url);
    const client = this.client;

    await new Promise<void>((resolve, reject) => {
      client.on("error", (error) => {
        WebsocketEventListenerPlugin.LOGGER.error(
          `Error connecting to server with url: ${url}\n error: ${error.name}, ${error.message}`
        );
        reject();
      });
      client.on("open", function open() {
        WebsocketEventListenerPlugin.LOGGER.info(
          `Connected to server with url: ${url}`
        );
        client.send(
          Buffer.from(JSON.stringify({ eventType: "publisherPluginStarted" }))
        );
        resolve();
      });
      client.on("ping", () => {
        client.send("pong");
      });
      client.on("close", () => {
        WebsocketEventListenerPlugin.LOGGER.info(
          `Disconnected from server with url: ${url}`
        );
        client.terminate();
      });
    });
  }

  disconnect() {
    if (this.client === undefined) {
      return;
    }
    WebsocketEventListenerPlugin.LOGGER.info(`Terminating client`);
    this.client.terminate();
  }

  async setupEventListener(): Promise<void> {
    await this.connect();
    if (this.client === undefined) {
      return;
    }

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("initializeStart", () =>
      handler(this.client, "initializeStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "initializeComplete",
      () => handler(this.client, "initializeComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("preprocessStart", () =>
      handler(this.client, "preprocessStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "preprocessComplete",
      () => handler(this.client, "preprocessComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("processStart", () =>
      handler(this.client, "processStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("processComplete", () =>
      handler(this.client, "processComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "postprocessStart",
      () => handler(this.client, "postprocessStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "postprocessComplete",
      () => handler(this.client, "postprocessComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "instrumentationStart",
      () => handler(this.client, "instrumentationStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "instrumentationComplete",
      () => handler(this.client, "instrumentationComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("targetRunStart", () =>
      handler(this.client, "targetRunStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "targetRunComplete",
      () => handler(this.client, "targetRunComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("reportStart", () =>
      handler(this.client, "reportStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("reportComplete", () =>
      handler(this.client, "reportComplete", {})
    );

    // search events
    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchInitializationStart",
      () => handler(this.client, "searchInitializationStart", {})
    );

    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchInitializationComplete",
      () => handler(this.client, "searchInitializationComplete", {})
    );

    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchStart",
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        _terminationManager: TerminationManager
      ) =>
        handler(
          this.client,
          "searchStart",
          searchProgressFormatter(searchAlgorithm, subject, budgetManager)
        )
    );

    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        _terminationManager: TerminationManager
      ) =>
        handler(
          this.client,
          "searchComplete",
          searchProgressFormatter(searchAlgorithm, subject, budgetManager)
        )
    );

    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchIterationStart",
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        _terminationManager: TerminationManager
      ) =>
        handler(
          this.client,
          "searchIterationStart",
          searchProgressFormatter(searchAlgorithm, subject, budgetManager)
        )
    );

    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchIterationComplete",
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        _terminationManager: TerminationManager
      ) =>
        handler(
          this.client,
          "searchIterationComplete",
          searchProgressFormatter(searchAlgorithm, subject, budgetManager)
        )
    );

    // analysis events
    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "sourceResolvingStart",
      <S>(rootContext: RootContext<S>, filePath: string) =>
        handler(
          this.client,
          "sourceResolvingStart",
          sourceModelFormatter(rootContext, filePath)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "sourceResolvingComplete",
      <S>(rootContext: RootContext<S>, filePath: string, source: string) => {
        handler(
          this.client,
          "sourceResolvingComplete",
          sourceModelFormatter(rootContext, filePath, source)
        );
      }
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "abstractSyntaxTreeResolvingStart",
      <S>(rootContext: RootContext<S>, filePath: string) =>
        handler(
          this.client,
          "abstractSyntaxTreeResolvingStart",
          abstractSyntaxTreeModelFormatter(rootContext, filePath)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "abstractSyntaxTreeResolvingComplete",
      <S>(
        rootContext: RootContext<S>,
        filePath: string,
        abstractSyntaxTree: S
      ) =>
        handler(
          this.client,
          "abstractSyntaxTreeResolvingComplete",
          abstractSyntaxTreeModelFormatter(
            rootContext,
            filePath,
            abstractSyntaxTree
          )
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "controlFlowGraphResolvingStart",
      <S>(rootContext: RootContext<S>, filePath: string) =>
        handler(
          this.client,
          "controlFlowGraphResolvingStart",
          controlFlowGraphModelFormatter(rootContext, filePath)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "controlFlowGraphResolvingComplete",
      <S>(
        rootContext: RootContext<S>,
        filePath: string,
        cfp: ControlFlowProgram
      ) =>
        handler(
          this.client,
          "controlFlowGraphResolvingComplete",
          controlFlowGraphModelFormatter(rootContext, filePath, cfp)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "targetExtractionStart",
      <S>(rootContext: RootContext<S>, filePath: string) =>
        handler(
          this.client,
          "targetExtractionStart",
          targetModelFormatter(rootContext, filePath)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "targetExtractionComplete",
      <S>(rootContext: RootContext<S>, filePath: string, target: Target) =>
        handler(
          this.client,
          "targetExtractionComplete",
          targetModelFormatter(rootContext, filePath, target)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "dependencyResolvingStart",
      <S>(rootContext: RootContext<S>, filePath: string) =>
        handler(
          this.client,
          "dependencyResolvingStart",
          dependencyModelFormatter(rootContext, filePath)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "dependencyResolvingComplete",
      <S>(
        rootContext: RootContext<S>,
        filePath: string,
        dependencies: string[]
      ) =>
        handler(
          this.client,
          "dependencyResolvingComplete",
          dependencyModelFormatter(rootContext, filePath, dependencies)
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

    optionsMap.set("ws-url", {
      alias: [],
      default: undefined,
      description: "The url of the listening WebSocket",
      group: OptionGroups.PublisherWSOptions,
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
  PublisherWSOptions = "Publishing WS Options:",
}
