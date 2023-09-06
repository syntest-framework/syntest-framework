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
  Metric,
  MetricManager,
  SeriesIndex,
  SeriesType,
} from "@syntest/metric";
import { EventListenerPlugin } from "@syntest/module";
import {
  BranchObjectiveFunction,
  BudgetManager,
  BudgetType,
  Encoding,
  Events,
  ExceptionObjectiveFunction,
  FunctionObjectiveFunction,
  ImplicitBranchObjectiveFunction,
  SearchAlgorithm,
  SearchSubject,
} from "@syntest/search";
import TypedEventEmitter from "typed-emitter";

import { metrics, PropertyName, SeriesName } from "../../Metrics";

export class SearchMetricListener extends EventListenerPlugin {
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

    const covered = [
      ...searchAlgorithm.getObjectiveManager().getCoveredObjectives(),
    ];

    const coveredPaths = 0;
    const coveredBranches = covered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof BranchObjectiveFunction
    ).length;
    const coveredFunctions = covered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof FunctionObjectiveFunction
    ).length;
    const coveredExceptions = covered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof ExceptionObjectiveFunction
    ).length;
    const coveredLines = 0;
    const coveredImplicitBranches = covered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof ImplicitBranchObjectiveFunction
    ).length;
    const coveredObjectives = covered.length;

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
    seriesType: SeriesType,
    seriesIndex: SeriesIndex,
    coveredPaths: number,
    coveredBranches: number,
    coveredFunctions: number,
    coveredLines: number,
    coveredImplicitBranches: number,
    covered: number,
    coveredExceptions: number
  ) {
    this.metricManager.recordSeries(
      SeriesName.PATH_OBJECTIVES_COVERED,
      seriesType,
      seriesIndex,
      coveredPaths
    );
    this.metricManager.recordSeries(
      SeriesName.BRANCH_OBJECTIVES_COVERED,
      seriesType,
      seriesIndex,
      coveredBranches
    );
    this.metricManager.recordSeries(
      SeriesName.EXCEPTION_OBJECTIVES_COVERED,
      seriesType,
      seriesIndex,
      coveredExceptions
    );
    this.metricManager.recordSeries(
      SeriesName.FUNCTION_OBJECTIVES_COVERED,
      seriesType,
      seriesIndex,
      coveredFunctions
    );
    this.metricManager.recordSeries(
      SeriesName.LINE_OBJECTIVES_COVERED,
      seriesType,
      seriesIndex,
      coveredLines
    );
    this.metricManager.recordSeries(
      SeriesName.IMPLICIT_BRANCH_OBJECTIVES_COVERED,
      seriesType,
      seriesIndex,
      coveredImplicitBranches
    );
    this.metricManager.recordSeries(
      SeriesName.OBJECTIVES_COVERED,
      seriesType,
      seriesIndex,
      covered
    );
  }

  recordFinalProperties<T extends Encoding>(
    searchAlgorithm: SearchAlgorithm<T>
  ): void {
    const covered = [
      ...searchAlgorithm.getObjectiveManager().getCoveredObjectives(),
    ];
    const uncovered = [
      ...searchAlgorithm.getObjectiveManager().getUncoveredObjectives(),
    ];

    // record finals
    const coveredPaths = 0;
    const coveredBranches = covered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof BranchObjectiveFunction
    ).length;
    const coveredFunctions = covered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof FunctionObjectiveFunction
    ).length;
    const coveredExceptions = covered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof ExceptionObjectiveFunction
    ).length;
    const coveredLines = 0;
    const coveredImplicitBranches = covered.filter(
      (objectiveFunction) =>
        objectiveFunction instanceof ImplicitBranchObjectiveFunction
    ).length;
    const coveredObjectives = covered.length;

    this.metricManager.recordProperty(
      PropertyName.PATH_OBJECTIVES_COVERED,
      coveredPaths.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.BRANCH_OBJECTIVES_COVERED,
      coveredBranches.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.FUNCTION_OBJECTIVES_COVERED,
      coveredFunctions.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.EXCEPTION_OBJECTIVES_COVERED,
      coveredExceptions.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.LINE_OBJECTIVES_COVERED,
      coveredLines.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.IMPLICIT_BRANCH_OBJECTIVES_COVERED,
      coveredImplicitBranches.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.OBJECTIVES_COVERED,
      coveredObjectives.toString()
    );

    // record totals
    const totalPaths = 0;
    const totalBranches =
      coveredBranches +
      uncovered.filter(
        (objectiveFunction) =>
          objectiveFunction instanceof BranchObjectiveFunction
      ).length;
    const totalFunctions =
      coveredFunctions +
      uncovered.filter(
        (objectiveFunction) =>
          objectiveFunction instanceof FunctionObjectiveFunction
      ).length;
    const totalExceptions =
      coveredExceptions +
      uncovered.filter(
        (objectiveFunction) =>
          objectiveFunction instanceof ExceptionObjectiveFunction
      ).length;
    const totalLines = 0;
    const totalImplicitBranches =
      coveredImplicitBranches +
      uncovered.filter(
        (objectiveFunction) =>
          objectiveFunction instanceof ImplicitBranchObjectiveFunction
      ).length;
    const total = coveredObjectives + uncovered.length;

    this.metricManager.recordProperty(
      PropertyName.PATH_OBJECTIVES_TOTAL,
      totalPaths.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.BRANCH_OBJECTIVES_TOTAL,
      totalBranches.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.FUNCTION_OBJECTIVES_TOTAL,
      totalFunctions.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.EXCEPTION_OBJECTIVES_TOTAL,
      totalExceptions.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.LINE_OBJECTIVES_TOTAL,
      totalLines.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.IMPLICIT_BRANCH_OBJECTIVES_TOTAL,
      totalImplicitBranches.toString()
    );
    this.metricManager.recordProperty(
      PropertyName.OBJECTIVES_TOTAL,
      total.toString()
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
        this.currentNamespace = subject.path;

        this.recordSeries(searchAlgorithm, subject, budgetManager);
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchIterationComplete",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        subject: SearchSubject<E>,
        budgetManager: BudgetManager<E>
      ) => this.recordSeries(searchAlgorithm, subject, budgetManager)
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
