import { Encoding } from "./Encoding";
import { SearchAlgorithm } from "./metaheuristics/SearchAlgorithm";
import { BudgetManager } from "./budget/BudgetManager";
import { TerminationManager } from "./termination/TerminationManager";

export interface SearchListener<T extends Encoding> {
  /**
   * Signal the search process has started.
   *
   * @param searchAlgorithm The search algorithm
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  searchStarted(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;

  /**
   * Signal the search initialization is done.
   *
   * @param searchAlgorithm The search algorithm
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  initializationDone(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;

  /**
   * Signal the search process has stopped.
   *
   * @param searchAlgorithm The search algorithm
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  searchStopped(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;

  /**
   * Signal a search iteration happened.
   *
   * @param searchAlgorithm The search algorithm
   * @param budgetManager The budget manager
   * @param terminationManager The termination manager
   */
  iteration(
    searchAlgorithm: SearchAlgorithm<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;
}
