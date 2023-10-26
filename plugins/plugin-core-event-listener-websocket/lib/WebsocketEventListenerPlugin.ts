/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  private _fid: string;
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

  get fid() {
    return this._fid;
  }

  set fid(_fid: string) {
    this._fid = _fid;
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
      client.on("open", () => {
        WebsocketEventListenerPlugin.LOGGER.info(
          `Connected to server with url: ${url}`
        );
        client.send(
          Buffer.from(
            JSON.stringify({ event: "publisherPluginStarted", fid: this._fid })
          )
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
      handler(this.client, this._fid, "initializeStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "initializeComplete",
      () => handler(this.client, this._fid, "initializeComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("preprocessStart", () =>
      handler(this.client, this._fid, "preprocessStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "preprocessComplete",
      () => handler(this.client, this._fid, "preprocessComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("processStart", () =>
      handler(this.client, this._fid, "processStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("processComplete", () =>
      handler(this.client, this._fid, "processComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "postprocessStart",
      () => handler(this.client, this._fid, "postprocessStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "postprocessComplete",
      () => handler(this.client, this._fid, "postprocessComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "instrumentationStart",
      () => handler(this.client, this._fid, "instrumentationStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "instrumentationComplete",
      () => handler(this.client, this._fid, "instrumentationComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("targetRunStart", () =>
      handler(this.client, this._fid, "targetRunStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on(
      "targetRunComplete",
      () => handler(this.client, this._fid, "targetRunComplete", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("reportStart", () =>
      handler(this.client, this._fid, "reportStart", {})
    );

    (<TypedEventEmitter<BaseLanguageEvents>>process).on("reportComplete", () =>
      handler(this.client, this._fid, "reportComplete", {})
    );

    // search events
    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchInitializationStart",
      () => handler(this.client, this._fid, "searchInitializationStart", {})
    );

    (<TypedEventEmitter<SearchEvents>>process).on(
      "searchInitializationComplete",
      () => handler(this.client, this._fid, "searchInitializationComplete", {})
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
          this._fid,
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
          this._fid,
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
          this._fid,
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
          this._fid,
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
          this._fid,
          "sourceResolvingStart",
          sourceModelFormatter(rootContext, filePath)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "sourceResolvingComplete",
      <S>(rootContext: RootContext<S>, filePath: string, source: string) => {
        handler(
          this.client,
          this._fid,
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
          this._fid,
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
          this._fid,
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
          this._fid,
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
          this._fid,
          "controlFlowGraphResolvingComplete",
          controlFlowGraphModelFormatter(rootContext, filePath, cfp)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "targetExtractionStart",
      <S>(rootContext: RootContext<S>, filePath: string) =>
        handler(
          this.client,
          this._fid,
          "targetExtractionStart",
          targetModelFormatter(rootContext, filePath)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "targetExtractionComplete",
      <S>(rootContext: RootContext<S>, filePath: string, target: Target) =>
        handler(
          this.client,
          this._fid,
          "targetExtractionComplete",
          targetModelFormatter(rootContext, filePath, target)
        )
    );

    (<TypedEventEmitter<AnalysisEvents>>process).on(
      "dependencyResolvingStart",
      <S>(rootContext: RootContext<S>, filePath: string) =>
        handler(
          this.client,
          this._fid,
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
          this._fid,
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
