import { Encoding } from "../Encoding";
import { BudgetListener } from "./BudgetListener";

/**
 * Interface for defining a budget.
 *
 * @author Mitchell Olsthoorn
 */
export interface Budget<T extends Encoding> extends BudgetListener<T> {
  /**
   * Return the remaining budget.
   */
  getRemainingBudget(): number;

  /**
   * Return the used up budget.
   */
  getUsedBudget(): number;

  /**
   * Return the total originally available budget.
   */
  getTotalBudget(): number;

  /**
   * Reset the budget.
   */
  reset(): void;
}
