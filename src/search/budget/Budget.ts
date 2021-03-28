import { Encoding } from "../Encoding";
import { BudgetListener } from "./BudgetListener";

/**
 * Interface for defining a budget.
 */
export interface Budget<T extends Encoding> extends BudgetListener<T> {
  /**
   * Return the remaining budget.
   */
  getAvailableBudget(): number;

  /**
   * Return the used up budget.
   */
  getCurrentBudget(): number;

  /**
   * Return the total originally available budget.
   */
  getTotalBudget(): number;

  /**
   * Reset the budget.
   */
  reset(): void;
}
