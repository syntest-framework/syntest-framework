import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchTimeBudget } from "./SearchTimeBudget";

/**
 * Budget for the total time of the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class TotalTimeBudget<T extends Encoding>
  extends SearchTimeBudget<T>
  implements Budget<T> {
  /**
   * @inheritDoc
   */
  initializationStarted(): void {
    this.searchStarted();
  }

  /**
   * @inheritDoc
   */
  initializationStopped(): void {
    this.searchStopped();
  }
}
