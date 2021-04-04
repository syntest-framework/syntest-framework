import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Budget for the search time of the search process.
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
  public constructor(maxSearchTime: number) {
    this._currentSearchTime = 0;
    this._maxSearchTime = maxSearchTime;
    this._counterTime = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  public evaluation(encoding: T): void {}

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
      return this._currentSearchTime + (currentTime - this._counterTime);
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
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  public iteration(searchAlgorithm: SearchAlgorithm<T>): void {}

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
  public start(): void {
    if (!this._tracking) {
      this._counterTime = Date.now() / 1000;
      this._tracking = true;
    }
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public startInitialization(): void {}

  /**
   * @inheritDoc
   */
  public stop(): void {
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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public stopInitialization(): void {}
}
