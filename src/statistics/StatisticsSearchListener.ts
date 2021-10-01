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
    this.collector.recordEventVariable(
      RuntimeVariable.COVERAGE,
      searchAlgorithm.progress
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
