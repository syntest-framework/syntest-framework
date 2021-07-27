import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Budget for the search time of the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class SearchTimeBudget<T extends Encoding> implements Budget<T> {
  /**
   * The current number of seconds.
   * @protected
   */
  protected _currentSearchTime: number;

  /**
   * The maximum number of seconds allowed.
   * @protected
   */
  protected _maxSearchTime: number;

  /**
   * The time the tracking started.
   * @protected
   */
  protected _counterTime: number;

  /**
   * If the budget is tracking progress
   * @protected
   */
  protected _tracking: boolean;

  /**
   * Constructor.
   *
   * @param maxSearchTime The maximum allowed time in seconds this budget should use
   */
  public constructor(maxSearchTime = Number.MAX_SAFE_INTEGER) {
    this._currentSearchTime = 0;
    this._maxSearchTime = maxSearchTime;
    this._counterTime = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  public getAvailableBudget(): number {
    return this._maxSearchTime - this.getCurrentBudget();
  }

  /**
   * @inheritDoc
   */
  public getCurrentBudget(): number {
    const currentTime = Date.now() / 1000;
    if (this._tracking) {
      const searchTime =
        this._currentSearchTime + (currentTime - this._counterTime);
      return Math.min(searchTime, this._maxSearchTime);
    } else {
      return this._currentSearchTime;
    }
  }

  /**
   * @inheritDoc
   */
  public getTotalBudget(): number {
    return this._maxSearchTime;
  }

  /**
   * @inheritDoc
   */
  public reset(): void {
    this._currentSearchTime = 0;
    this._counterTime = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public initializationStarted(): void {}

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public initializationStopped(): void {}

  /**
   * @inheritDoc
   */
  public searchStarted(): void {
    if (!this._tracking) {
      this._counterTime = Date.now() / 1000;
      this._tracking = true;
    }
  }

  /**
   * @inheritDoc
   */
  public searchStopped(): void {
    if (this._tracking) {
      const currentTime = Date.now() / 1000;

      if (
        this._currentSearchTime + currentTime - this._counterTime >
        this._maxSearchTime
      ) {
        this._currentSearchTime = this._maxSearchTime;
      } else {
        this._currentSearchTime += currentTime - this._counterTime;
      }

      this._counterTime = 0;
      this._tracking = false;
    }
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  public iteration(searchAlgorithm: SearchAlgorithm<T>): void {}

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  public evaluation(encoding: T): void {}
}
