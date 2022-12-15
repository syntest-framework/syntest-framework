/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { SearchListener } from "../search/SearchListener";
import { Encoding } from "../search/Encoding";
import { SearchAlgorithm } from "../search/metaheuristics/SearchAlgorithm";
import { BudgetManager } from "../search/budget/BudgetManager";
import { TerminationManager } from "../search/termination/TerminationManager";
import { StatisticsCollector } from "./StatisticsCollector";
import { RuntimeVariable } from "./RuntimeVariable";

/**
 * A search listener that updates the statistics over time.
 *
 * TODO: possible use setInterval to update the statistics at a fixed interval
 *
 * @author Mitchell Olsthoorn
 */
export class StatisticsSearchListener<T extends Encoding>
  implements SearchListener<T>
{
  /**
   * The statistics collector
   * @protected
   */
  protected collector: StatisticsCollector<T>;

  /**
   * Constructor.
   *
   * @param collector The collector to use
   */
  constructor(collector: StatisticsCollector<T>) {
    this.collector = collector;
  }

  /**
   * Updates the collector.
   *
   * @param searchAlgorithm The search algorithm used
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  update(
    searchAlgorithm: SearchAlgorithm<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    budgetManager: BudgetManager<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    terminationManager: TerminationManager
  ): void {
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
      RuntimeVariable.COVERED_BRANCHES,
      coveredBranches
    );
    this.collector.recordEventVariable(
      RuntimeVariable.TOTAL_BRANCHES,
      totalBranches
    );
    this.collector.recordEventVariable(
      RuntimeVariable.BRANCH_COVERAGE,
      searchAlgorithm.progress("branch")
    );

    this.collector.recordEventVariable(
      RuntimeVariable.COVERED_FUNCTIONS,
      coveredFunctions
    );
    this.collector.recordEventVariable(
      RuntimeVariable.TOTAL_FUNCTIONS,
      totalFunctions
    );
    this.collector.recordEventVariable(
      RuntimeVariable.FUNCTION_COVERAGE,
      searchAlgorithm.progress("function")
    );

    this.collector.recordEventVariable(
      RuntimeVariable.COVERED_EXCEPTIONS,
      coveredExceptions
    );

    this.collector.recordEventVariable(
      RuntimeVariable.COVERED_PROBES,
      coveredProbes
    );
    this.collector.recordEventVariable(
      RuntimeVariable.TOTAL_PROBES,
      totalProbes
    );
    this.collector.recordEventVariable(
      RuntimeVariable.PROBE_COVERAGE,
      searchAlgorithm.progress("probe")
    );

    this.collector.recordEventVariable(
      RuntimeVariable.COVERED_OBJECTIVES,
      covered
    );
    this.collector.recordEventVariable(RuntimeVariable.TOTAL_OBJECTIVES, total);
    this.collector.recordEventVariable(
      RuntimeVariable.COVERAGE,
      searchAlgorithm.progress("mixed")
    );
  }

  /**
   * @inheritDoc
   */
  searchStarted(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void {
    this.update(searchAlgorithm, budgetManager, terminationManager);
  }

  /**
   * @inheritDoc
   */
  initializationDone(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void {
    this.update(searchAlgorithm, budgetManager, terminationManager);
  }

  /**
   * @inheritDoc
   */
  searchStopped(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void {
    this.update(searchAlgorithm, budgetManager, terminationManager);
  }

  /**
   * @inheritDoc
   */
  iteration(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void {
    this.update(searchAlgorithm, budgetManager, terminationManager);
  }
}
