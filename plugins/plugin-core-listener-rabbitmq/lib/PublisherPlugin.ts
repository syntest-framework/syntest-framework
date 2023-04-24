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
import { ControlFlowGraph } from "@syntest/cfg-core";
import {
  BudgetManager,
  Encoding,
  Events,
  SearchAlgorithm,
  SearchSubject,
 TerminationManager } from "@syntest/core";
import { ListenerPlugin } from "@syntest/module";
import TypedEventEmitter from "typed-emitter";
import Yargs = require("yargs");

import { onEventActions } from "./onEventActions";
import { RabbitProducer } from "./RabbitProducer";

export type PublisherOptions = {
  publisher: string;
};

/**
 * This graphing plugin creates a listener that creates an SVG based on the generated CFG.
 *
 * @author Dimitri Stallenberg
 */
export class PublisherPlugin extends ListenerPlugin {
  private rp: RabbitProducer;
  constructor(rp: RabbitProducer) {
    super(
      "RabbitMQ Publisher",
      "Publishes events that occurred during the execution into RabbitMQ"
    );
    this.rp = rp;
    void this.rp.sendData({ eventType: "publisherPluginStarted" });
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "initializeStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("initializeStart", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "initializeComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("initializeComplete", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "preprocessStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("preprocessStart", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "preprocessComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("preprocessComplete", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "processStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("processStart", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "processComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("processComplete", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "postprocessStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("postprocessStart", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "postprocessComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("postprocessComplete", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "exit",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("exit", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "instrumentationStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("instrumentationStart", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "instrumentationComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("instrumentationComplete", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "targetRunStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("targetRunStart", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "targetRunComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("targetRunComplete", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "reportStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("reportStart", this.rp)
    );

    (<TypedEventEmitter<Events>>process).on(
      "reportComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      () => onEventActions.onVoidEvent("reportComplete", this.rp)
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
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
          this.rp,
          rootContext,
          cfg
        );
      }
    );
  }

  override getCommandOptions(
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
      description: "The IP of the listening RabbitMQ",
      group: OptionGroups.PublisherOptions,
      hidden: false,
      normalize: true,
      type: "string",
    });

    optionsMap.set("port", {
      alias: [],
      default: "5672",
      description: "The port of the listening RabbitMQ",
      group: OptionGroups.PublisherOptions,
      hidden: false,
      normalize: true,
      type: "string",
    });

    return optionsMap;
  }
}

export enum OptionGroups {
  PublisherOptions = "Publishing Options:",
}
