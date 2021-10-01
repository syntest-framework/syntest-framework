import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Listener for budget signals.
 *
 * These methods are called from within the search process.
 *
 * @author Mitchell Olsthoorn
 */
export interface BudgetListener<T extends Encoding> {
  /**
   * Start initialization budget tracking.
   */
  initializationStarted(): void;

  /**
   * Stop initialization budget tracking.
   */
  initializationStopped(): void;

  /**
   * Start search budget tracking.
   */
  searchStarted(): void;

  /**
   * Stop search budget tracking.
   */
  searchStopped(): void;

  /**
   * Signal iteration happened.
   *
   * @param searchAlgorithm The search algorithm
   */
  iteration(searchAlgorithm: SearchAlgorithm<T>): void;

  /**
   * Signal evaluation happened.
   *
   * @param encoding The encoding that was evaluated
   */
  evaluation(encoding: T): void;
}
