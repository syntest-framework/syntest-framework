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

import { ListenerPlugin, ModuleManager } from "@syntest/module";
import TypedEventEmitter from "typed-emitter";
import { Metric, MetricManager } from "@syntest/metric";
import { metrics } from "../../Metrics";

export class SearchStatisticsListener extends ListenerPlugin {
  protected currentNamespace: string;
  protected metricManagerMap: Map<string, MetricManager>;

  /**
   * Constructor.
   *
   */
  constructor() {
    super(
      "SearchStatisticsListener",
      "A listener that collects statistics about the search process."
    );
    this.metricManagerMap = new Map();
  }

  async createNewMetricManager(namespace: string) {
    if (this.metricManagerMap.has(namespace)) {
      throw new Error(
        `Metric manager for namespace ${namespace} already exists`
      );
    }

    // Initialize the metric manager
    // const plugins = await ModuleManager.instance.getPluginsOfType(
    //   PluginType.METRIC_MIDDLEWARE
    // );
    const metrics = await ModuleManager.instance.getMetrics();
    const manager = new MetricManager(metrics);
    this.metricManagerMap.set(namespace, manager);
    this.currentNamespace = namespace;

    return manager;
  }

  get metricManager() {
    if (!this.currentNamespace) {
      throw new Error("No namespace set");
    }

    if (!this.metricManagerMap.has(this.currentNamespace)) {
      throw new Error(
        `Metric manager for namespace ${this.currentNamespace} does not exist`
      );
    }

    return this.metricManagerMap.get(this.currentNamespace);
  }

  /**
   * Updates the collector.
   *
   * @param searchAlgorithm The search algorithm used
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  recordSeries<T extends Encoding>(
    searchAlgorithm: SearchAlgorithm<T>,
    subject: SearchSubject<T>,
    budgetManager: BudgetManager<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    terminationManager: TerminationManager
  ): void {
    const iterations = budgetManager
      .getBudgetObject("iteration")
      .getUsedBudget();
    const evaluations = budgetManager
      .getBudgetObject("evaluation")
      .getUsedBudget();
    let searchTime = budgetManager
      .getBudgetObject("search-time")
      .getUsedBudget();
    let totalTime = budgetManager.getBudgetObject("total-time").getUsedBudget();

    searchTime = Math.round(searchTime * 1000) / 1000;
    totalTime = Math.round(totalTime * 1000) / 1000;

    const coveredPaths = searchAlgorithm.getCovered("path");
    const coveredBranches = searchAlgorithm.getCovered("branch");
    const coveredExceptions = searchAlgorithm.getCovered("exception");
    const coveredFunctions = searchAlgorithm.getCovered("function");
    const coveredLines = searchAlgorithm.getCovered("lines");
    const coveredProbes = searchAlgorithm.getCovered("probe");
    const covered = searchAlgorithm.getCovered();

    // search times
    this.recordCoveredSeries(
      "search-time",
      searchTime,
      coveredPaths,
      coveredBranches,
      coveredFunctions,
      coveredLines,
      coveredProbes,
      covered,
      coveredExceptions
    );
    this.recordCoveredSeries(
      "total-time",
      totalTime,
      coveredPaths,
      coveredBranches,
      coveredFunctions,
      coveredLines,
      coveredProbes,
      covered,
      coveredExceptions
    );
    this.recordCoveredSeries(
      "iteration",
      iterations,
      coveredPaths,
      coveredBranches,
      coveredFunctions,
      coveredLines,
      coveredProbes,
      covered,
      coveredExceptions
    );
    this.recordCoveredSeries(
      "evaluation",
      evaluations,
      coveredPaths,
      coveredBranches,
      coveredFunctions,
      coveredLines,
      coveredProbes,
      covered,
      coveredExceptions
    );
  }

  recordCoveredSeries(
    type: string,
    index: number,
    coveredPaths: number,
    coveredBranches: number,
    coveredFunctions: number,
    coveredLines: number,
    coveredProbes: number,
    covered: number,
    coveredExceptions: number
  ) {
    this.metricManager.recordSeries("covered-paths", type, index, coveredPaths);
    this.metricManager.recordSeries(
      "covered-branches",
      type,
      index,
      coveredBranches
    );
    this.metricManager.recordSeries(
      "covered-exceptions",
      type,
      index,
      coveredExceptions
    );
    this.metricManager.recordSeries(
      "covered-functions",
      type,
      index,
      coveredFunctions
    );
    this.metricManager.recordSeries("covered-lines", type, index, coveredLines);
    this.metricManager.recordSeries(
      "covered-probes",
      type,
      index,
      coveredProbes
    );
    this.metricManager.recordSeries("covered-objectives", type, index, covered);
  }

  recordStartProperties<T extends Encoding>(
    searchAlgorithm: SearchAlgorithm<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subject: SearchSubject<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    budgetManager: BudgetManager<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    terminationManager: TerminationManager
  ): void {
    // record totals
    const coveredPaths = searchAlgorithm.getCovered("path");
    const coveredBranches = searchAlgorithm.getCovered("branch");
    const coveredFunctions = searchAlgorithm.getCovered("function");
    const coveredLines = searchAlgorithm.getCovered("lines");
    const coveredProbes = searchAlgorithm.getCovered("probe");
    const covered = searchAlgorithm.getCovered();

    // TODO check if uncovered is correct for for example dynamosa
    const totalPaths = coveredPaths + searchAlgorithm.getUncovered("path");
    const totalBranches =
      coveredBranches + searchAlgorithm.getUncovered("branch");
    const totalFunctions =
      coveredFunctions + searchAlgorithm.getUncovered("function");
    const totalLines = coveredLines + searchAlgorithm.getUncovered("lines");
    const totalProbes = coveredProbes + searchAlgorithm.getUncovered("probe");
    const total = covered + searchAlgorithm.getUncovered();

    this.metricManager.recordProperty("total-paths", totalPaths.toString());
    this.metricManager.recordProperty(
      "total-branches",
      totalBranches.toString()
    );
    this.metricManager.recordProperty(
      "total-functions",
      totalFunctions.toString()
    );
    this.metricManager.recordProperty("total-lines", totalLines.toString());
    this.metricManager.recordProperty("total-probes", totalProbes.toString());
    this.metricManager.recordProperty("total-objectives", total.toString());
  }

  recordEndProperties<T extends Encoding>(
    searchAlgorithm: SearchAlgorithm<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subject: SearchSubject<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    budgetManager: BudgetManager<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    terminationManager: TerminationManager
  ): void {
    // TODO
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "searchStart",
      (
        searchAlgorithm: SearchAlgorithm<any>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        subject: SearchSubject<any>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        budgetManager: BudgetManager<any>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        terminationManager: TerminationManager
      ) => {
        // create a new metric manager for this search subject
        this.createNewMetricManager(subject.name);

        this.recordStartProperties(
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
        this.recordSeries(
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationStart",
      this.recordSeries
    );
    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationComplete",
      this.recordSeries
    );
    (<TypedEventEmitter<Events>>process).on(
      "searchIterationComplete",
      this.recordSeries
    );
    (<TypedEventEmitter<Events>>process).on(
      "searchComplete",
      (
        searchAlgorithm: SearchAlgorithm<any>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        subject: SearchSubject<any>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        budgetManager: BudgetManager<any>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        terminationManager: TerminationManager
      ) => {
        this.recordSeries(
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
        this.recordEndProperties(
          searchAlgorithm,
          subject,
          budgetManager,
          terminationManager
        );
      }
    );
  }

  getMetrics(): Metric[] | Promise<Metric[]> {
    return metrics;
  }
}
