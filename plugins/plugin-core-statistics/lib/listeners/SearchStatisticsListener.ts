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
  BudgetManager,
  Encoding,
  Events,
  SearchAlgorithm,
  SearchSubject,
  TerminationManager,
} from "@syntest/core";
import { ListenerPlugin } from "@syntest/module";
import TypedEventEmitter from "typed-emitter";
import { StatisticsCollector } from "../statistics/StatisticsCollector";
import { Timing } from "../statistics/Timing";
import { RuntimeVariable } from "../statistics/RuntimeVariable";

export class SearchStatisticsListener extends ListenerPlugin {
  /**
   * The statistics collector
   * @protected
   */
  protected _collector: StatisticsCollector;
  protected timing: Timing;

  /**
   * Constructor.
   *
   * @param collector The collector to use
   */
  constructor(collector: StatisticsCollector, timing: Timing) {
    super(
      "SearchStatisticsListener",
      "A listener that collects statistics about the search process."
    );
    this._collector = collector;
    this.timing = timing;
  }

  get collector() {
    return this._collector;
  }

  /**
   * Updates the collector.
   *
   * @param searchAlgorithm The search algorithm used
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  update<T extends Encoding>(
    searchAlgorithm: SearchAlgorithm<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subject: SearchSubject<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    budgetManager: BudgetManager<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    terminationManager: TerminationManager
  ): void {
    const searchTime = this.timing.getTimeSinceLastEvent("searchStart");
    const eventTime = Math.round(searchTime * 10) / 10;

    const coveredBranches = searchAlgorithm.getCovered("branch");
    const totalBranches =
      coveredBranches + searchAlgorithm.getUncovered("branch");

    const coveredFunctions = searchAlgorithm.getCovered("function");
    const totalFunctions =
      coveredBranches + searchAlgorithm.getUncovered("function");

    const coveredExceptions = searchAlgorithm.getCovered("exception");

    const coveredProbes = searchAlgorithm.getCovered("probe");
    const totalProbes = coveredBranches + searchAlgorithm.getUncovered("probe");

    const covered = searchAlgorithm.getCovered();
    const total = coveredBranches + searchAlgorithm.getUncovered();

    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.COVERED_BRANCHES,
      coveredBranches
    );
    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.TOTAL_BRANCHES,
      totalBranches
    );
    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.BRANCH_COVERAGE,
      searchAlgorithm.progress("branch")
    );

    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.COVERED_FUNCTIONS,
      coveredFunctions
    );
    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.TOTAL_FUNCTIONS,
      totalFunctions
    );
    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.FUNCTION_COVERAGE,
      searchAlgorithm.progress("function")
    );

    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.COVERED_EXCEPTIONS,
      coveredExceptions
    );

    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.COVERED_PROBES,
      coveredProbes
    );
    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.TOTAL_PROBES,
      totalProbes
    );
    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.PROBE_COVERAGE,
      searchAlgorithm.progress("probe")
    );

    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.COVERED_OBJECTIVES,
      covered
    );
    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.TOTAL_OBJECTIVES,
      total
    );
    this.collector.recordEventVariable(
      eventTime,
      RuntimeVariable.COVERAGE,
      searchAlgorithm.progress("mixed")
    );
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on("searchStart", () => {
      this.timing.recordEventTime("searchStart");
    });

    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationStart",
      this.update
    );
    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationComplete",
      this.update
    );
    (<TypedEventEmitter<Events>>process).on(
      "searchIterationComplete",
      this.update
    );
    (<TypedEventEmitter<Events>>process).on("searchComplete", this.update);
  }
}
