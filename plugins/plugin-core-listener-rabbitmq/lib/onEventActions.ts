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
  SearchAlgorithm,
  SearchSubject,
 TerminationManager } from "@syntest/core";

import { RabbitProducer } from "./RabbitProducer";

export const onEventActions = {
  onVoidEvent(eventTypeName: string, rp: RabbitProducer): void {
    void rp.sendData({ eventType: eventTypeName });
  },

  onAlgorithmEvent(
    eventTypeName: string,
    rp: RabbitProducer,
    _searchAlgorithm: SearchAlgorithm<Encoding>,
    _subject: SearchSubject<Encoding>,
    _budgetManager: BudgetManager<Encoding>,
    _terminationManager: TerminationManager
  ): void {
    void rp.sendData({
      eventType: eventTypeName,
      eventData: {
        searchAlgorithm: _searchAlgorithm,
        subject: _subject,
        budgetManager: _budgetManager,
        terminationManager: _terminationManager,
      },
    });
  },

  onRootContextEvent(
    eventTypeName: string,
    rp: RabbitProducer,
    _rootContext: RootContext<unknown>
  ): void {
    void rp.sendData({
      eventType: eventTypeName,
      eventData: {
        rootContext: _rootContext,
      },
    });
  },

  onControlFlowGraphResolvingComplete(
    eventTypeName: string,
    rp: RabbitProducer,
    _rootContext: RootContext<unknown>,
    _cfg: ControlFlowGraph<unknown>
  ): void {
    void rp.sendData({
      eventType: eventTypeName,
      eventData: {
        rootContext: _rootContext,
        cfg: _cfg,
      },
    });
  },
};
