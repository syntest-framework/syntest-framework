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
  BudgetType,
  Encoding,
  Events,
  ObjectiveType,
  SearchAlgorithm,
  SearchSubject,
} from "@syntest/core";
import { Metric, MetricManager, SeriesType } from "@syntest/metric";
import { ListenerPlugin } from "@syntest/module";
import TypedEventEmitter from "typed-emitter";

import { metrics, PropertyName, SeriesName } from "../../Metrics";

export class SearchMetricListener extends ListenerPlugin {
  protected currentNamespace: string;
  protected _metricManager: MetricManager;

  /**
   * Constructor.
   */
  constructor() {
    super(
      "SearchMetricListener",
      "A listener that collects statistics about the search process."
    );
  }

  get metricManager() {
    if (!this.currentNamespace) {
      throw new Error("No namespace set");
    }

    return this._metricManager.getNamespaced(this.currentNamespace);
  }

  /**
   * Updates the collector.
   *
   * @param searchAlgorithm The search algorithm used
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  recordSeries<E extends Encoding>(
    searchAlgorithm: SearchAlgorithm<E>,
    subject: SearchSubject<E>,
    budgetManager: BudgetManager<E>
  ): void {
    const iterations = budgetManager
      .getBudgetObject(BudgetType.ITERATION)
      .getUsedBudget();
    const evaluations = budgetManager
      .getBudgetObject(BudgetType.EVALUATION)
      .getUsedBudget();
    let searchTime = budgetManager
      .getBudgetObject(BudgetType.SEARCH_TIME)
      .getUsedBudget();
    let totalTime = budgetManager
      .getBudgetObject(BudgetType.TOTAL_TIME)
      .getUsedBudget();

    searchTime = Math.round(searchTime * 1000) / 1000;
    totalTime = Math.round(totalTime * 1000) / 1000;

    const coveredPaths = searchAlgorithm.getCovered(ObjectiveType.PATH);
    const coveredBranches = searchAlgorithm.getCovered(ObjectiveType.BRANCH);
    const coveredExceptions = searchAlgorithm.getCovered(
      ObjectiveType.EXCEPTION
    );
    const coveredFunctions = searchAlgorithm.getCovered(ObjectiveType.FUNCTION);
    const coveredLines = searchAlgorithm.getCovered(ObjectiveType.LINE);
    const coveredImplicitBranches = searchAlgorithm.getCovered(
      ObjectiveType.IMPLICIT_BRANCH
    );
    const coveredObjectives = searchAlgorithm.getCovered();

    // search times
    this.recordCoveredSeries(
      SeriesType.SEARCH_TIME,
      searchTime,
      coveredPaths,
      coveredBranches,
      coveredFunctions,
      coveredLines,
      coveredImplicitBranches,
      coveredObjectives,
      coveredExceptions
    );
    this.recordCoveredSeries(
      SeriesType.TOTAL_TIME,
      totalTime,
      coveredPaths,
      coveredBranches,
      coveredFunctions,
      coveredLines,
      coveredImplicitBranches,
      coveredObjectives,
      coveredExceptions
    );
    this.recordCoveredSeries(
      SeriesType.ITERATION,
      iterations,
      coveredPaths,
      coveredBranches,
      coveredFunctions,
      coveredLines,
      coveredImplicitBranches,
      coveredObjectives,
      coveredExceptions
    );
    this.recordCoveredSeries(
      SeriesType.EVALUATION,
      evaluations,
      coveredPaths,
      coveredBranches,
      coveredFunctions,
      coveredLines,
      coveredImplicitBranches,
      coveredObjectives,
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
    coveredImplicitBranches: number,
    covered: number,
    coveredExceptions: number
  ) {
    this.metricManager.recordSeries(
      SeriesName.PATHS_COVERED,
      type,
      index,
      coveredPaths
    );
    this.metricManager.recordSeries(
      SeriesName.BRANCHES_COVERED,
      type,
      index,
      coveredBranches
    );
    this.metricManager.recordSeries(
      SeriesName.EXCEPTIONS_COVERED,
      type,
      index,
      coveredExceptions
    );
    this.metricManager.recordSeries(
      SeriesName.FUNCTIONS_COVERED,
      type,
      index,
      coveredFunctions
    );
    this.metricManager.recordSeries(
      SeriesName.LINES_COVERED,
      type,
      index,
      coveredLines
    );
    this.metricManager.recordSeries(
      SeriesName.IMPLICIT_BRANCHES_COVERED,
      type,
      index,
      coveredImplicitBranches
    );
    this.metricManager.recordSeries(
      SeriesName.OBJECTIVES_COVERED,
      type,
      index,
      covered
    );
  }

  recordInitialProperties<T extends Encoding>(
    searchAlgorithm: SearchAlgorithm<T>
  ): void {
    // record totals
    const coveredPaths = searchAlgorithm.getCovered(ObjectiveType.PATH);
    const coveredBranches = searchAlgorithm.getCovered(ObjectiveType.BRANCH);
    const coveredFunctions = searchAlgorithm.getCovered(ObjectiveType.FUNCTION);
    const coveredLines = searchAlgorithm.getCovered(ObjectiveType.LINE);
    const coveredImplicitBranches = searchAlgorithm.getCovered(
      ObjectiveType.IMPLICIT_BRANCH
    );
    const coveredObjectives = searchAlgorithm.getCovered();

    const totalPaths =
      coveredPaths + searchAlgorithm.getUncovered(ObjectiveType.PATH);
    const totalBranches =
      coveredBranches + searchAlgorithm.getUncovered(ObjectiveType.BRANCH);
    const totalFunctions =
      coveredFunctions + searchAlgorithm.getUncovered(ObjectiveType.FUNCTION);
    const totalLines =
      coveredLines + searchAlgorithm.getUncovered(ObjectiveType.LINE);
    const totalImplicitBranches =
      coveredImplicitBranches +
      searchAlgorithm.getUncovered(ObjectiveType.IMPLICIT_BRANCH);
    const total = coveredObjectives + searchAlgorithm.getUncovered();

    this.metricManager.recordProperty(
      PropertyName.PATHS_TOTAL,
      totalPaths.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.BRANCHES_TOTAL,
      totalBranches.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.FUNCTIONS_TOTAL,
      totalFunctions.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.LINES_TOTAL,
      totalLines.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.IMPLICIT_BRANCHES_TOTAL,
      totalImplicitBranches.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.OBJECTIVES_TOTAL,
      total.toString()
    );
  }

  recordFinalProperties<T extends Encoding>(
    searchAlgorithm: SearchAlgorithm<T>
  ): void {
    // record finals
    const coveredPaths = searchAlgorithm.getCovered(ObjectiveType.PATH);
    const coveredBranches = searchAlgorithm.getCovered(ObjectiveType.BRANCH);
    const coveredFunctions = searchAlgorithm.getCovered(ObjectiveType.FUNCTION);
    const coveredLines = searchAlgorithm.getCovered(ObjectiveType.LINE);
    const coveredImplicitBranches = searchAlgorithm.getCovered(
      ObjectiveType.IMPLICIT_BRANCH
    );
    const coveredObjectives = searchAlgorithm.getCovered();

    this.metricManager.recordProperty(
      PropertyName.PATHS_COVERED,
      coveredPaths.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.BRANCHES_COVERED,
      coveredBranches.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.FUNCTIONS_COVERED,
      coveredFunctions.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.LINES_COVERED,
      coveredLines.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.IMPLICIT_BRANCHES_COVERED,
      coveredImplicitBranches.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.OBJECTIVES_COVERED,
      coveredObjectives.toString()
    );
  }

  setupEventListener(metricManager: MetricManager): void {
    this._metricManager = metricManager;

    (<TypedEventEmitter<Events>>process).on(
      "searchStart",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        subject: SearchSubject<E>,
        budgetManager: BudgetManager<E>
      ) => {
        // create a new metric manager for this search subject
        this.currentNamespace = subject.name;

        this.recordInitialProperties(searchAlgorithm);
        this.recordSeries(searchAlgorithm, subject, budgetManager);
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationStart",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.recordSeries
    );
    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.recordSeries
    );
    (<TypedEventEmitter<Events>>process).on(
      "searchIterationComplete",
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.recordSeries
    );
    (<TypedEventEmitter<Events>>process).on(
      "searchComplete",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        subject: SearchSubject<E>,
        budgetManager: BudgetManager<E>
      ) => {
        this.recordSeries(searchAlgorithm, subject, budgetManager);
        this.recordFinalProperties(searchAlgorithm);
      }
    );
  }

  override getMetrics(): Metric[] | Promise<Metric[]> {
    return metrics;
  }

  override getOptions() {
    return new Map();
  }

  override getOptionChoices(): string[] {
    return [];
  }
}
