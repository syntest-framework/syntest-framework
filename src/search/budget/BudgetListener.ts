import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Listener for budget signals.
 *
 * These methods are called from within the search process.
 *
 * @author Mitchell Olsthoorn
 */
export interface BudgetListener<T extends Encoding<T>> {
  /**
   * Signal evaluation happened.
   *
   * @param encoding The encoding that was evaluated
   */
  evaluation(encoding: T): void;

  /**
   * Signal iteration happened.
   *
   * @param searchAlgorithm The search algorithm
   */
  iteration(searchAlgorithm: SearchAlgorithm<T>): void;

  /**
   * Start budget tracking.
   */
  start(): void;

  /**
   * Start initialization budget tracking.
   */
  startInitialization(): void;

  /**
   * Stop budget tracking.
   */
  stop(): void;

  /**
   * Stop initialization budget tracking.
   */
  stopInitialization(): void;
}
