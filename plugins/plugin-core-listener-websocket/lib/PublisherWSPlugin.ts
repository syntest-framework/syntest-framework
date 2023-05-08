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

import { RootContext } from "@syntest/analysis";
import { ControlFlowGraph } from "@syntest/cfg";
import {
  BudgetManager,
  Encoding,
  Events,
  SearchAlgorithm,
  SearchSubject,
  TerminationManager,
} from "@syntest/core";
import { EventListenerPlugin } from "@syntest/module";
import TypedEventEmitter from "typed-emitter";
import Yargs = require("yargs");

import { onEventActions } from "./onEventActions";

export type PublisherWSOptions = {
  ip: string;
  port: string;
};

/**
 * This plugin publishes all of the SynTest's events to the specified url with WebSocket protocol.
 *
 * @author Yehor Kozyr
 */
export class PublisherWSPlugin extends EventListenerPlugin {
  private socket: WebSocket;
  constructor(socket: WebSocket) {
    super(
      "WebSocket Publisher",
      "Publishes events that occurred during the execution into WebSocket"
    );
    socket = new WebSocket(
      "ws://" +
        (<PublisherWSOptions>(<unknown>this.args)).ip +
        ":" +
        (<PublisherWSOptions>(<unknown>this.args)).port
    );
    this.socket = socket;
    setTimeout(() => {
      this.socket.send(
        Buffer.from(JSON.stringify({ eventType: "publisherPluginStarted" }))
      );
    }, 1000);
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "initializeStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("initializeStart", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "initializeComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("initializeComplete", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "preprocessStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("preprocessStart", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "preprocessComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("preprocessComplete", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "processStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("processStart", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "processComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("processComplete", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "postprocessStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("postprocessStart", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "postprocessComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("postprocessComplete", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "exit",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("exit", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "instrumentationStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("instrumentationStart", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "instrumentationComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("instrumentationComplete", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "targetRunStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("targetRunStart", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "targetRunComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("targetRunComplete", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "reportStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("reportStart", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "reportComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("reportComplete", this.socket)
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        terminationManager: TerminationManager
      ) => {
        onEventActions.onAlgorithmEvent(
          "searchInitializationStart",
          this.socket,
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        terminationManager: TerminationManager
      ) => {
        onEventActions.onAlgorithmEvent(
          "searchInitializationComplete",
          this.socket,
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        terminationManager: TerminationManager
      ) => {
        onEventActions.onAlgorithmEvent(
          "searchStart",
          this.socket,
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        terminationManager: TerminationManager
      ) => {
        onEventActions.onAlgorithmEvent(
          "searchComplete",
          this.socket,
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchIterationStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        terminationManager: TerminationManager
      ) => {
        onEventActions.onAlgorithmEvent(
          "searchIterationStart",
          this.socket,
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchIterationComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (
        searchAlgorithm: SearchAlgorithm<Encoding>,
        subject: SearchSubject<Encoding>,
        budgetManager: BudgetManager<Encoding>,
        terminationManager: TerminationManager
      ) => {
        onEventActions.onAlgorithmEvent(
          "searchIterationComplete",
          this.socket,
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "targetLoadStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "targetLoadStart",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "targetLoadComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "targetLoadComplete",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "sourceResolvingStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "sourceResolvingStart",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "sourceResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "sourceResolvingComplete",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "targetResolvingStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "targetResolvingStart",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "targetResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "targetResolvingComplete",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "functionMapResolvingStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "functionMapResolvingStart",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "functionMapResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "functionMapResolvingComplete",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "dependencyResolvingStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "dependencyResolvingStart",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "dependencyResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "dependencyResolvingComplete",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "controlFlowGraphResolvingStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "controlFlowGraphResolvingStart",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "abstractSyntaxTreeResolvingStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "abstractSyntaxTreeResolvingStart",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "abstractSyntaxTreeResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>) => {
        onEventActions.onRootContextEvent(
          "abstractSyntaxTreeResolvingComplete",
          this.socket,
          rootContext
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "controlFlowGraphResolvingComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      (rootContext: RootContext<unknown>, cfg: ControlFlowGraph<unknown>) => {
        onEventActions.onControlFlowGraphResolvingComplete(
          "controlFlowGraphResolvingComplete",
          this.socket,
          rootContext,
          cfg
        );
      }
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

    optionsMap.set("ip", {
      alias: [],
      default: "localhost",
      description: "The IP of the listening WebSocket",
      group: OptionGroups.PublisherWSOptions,
      hidden: false,
      normalize: true,
      type: "string",
    });

    optionsMap.set("port", {
      alias: [],
      default: "80",
      description: "The port of the listening WebSocket",
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
