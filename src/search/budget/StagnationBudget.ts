import { Encoding } from "../Encoding";
import { Budget } from "./Budget";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Budget for the number of iteration performed without progress during the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class StagnationBudget<T extends Encoding> implements Budget<T> {
  /**
   * The current number of iterations without progress.
   * @protected
   */
  protected _currentIterations: number;

  /**
   * The maximum number of evaluations allowed without progress.
   * @protected
   */
  protected readonly _maxIterations: number;

  /**
   * The best progress seen so far.
   * @protected
   */
  protected _bestProgress: number;

  /**
   * If the budget is tracking progress
   * @protected
   */
  protected _tracking: boolean;

  /**
   * Constructor.
   *
   * @param maxIterations The maximum number of iterations without progress of this budget
   */
  constructor(maxIterations = Number.MAX_SAFE_INTEGER) {
    this._currentIterations = 0;
    this._maxIterations = maxIterations;
    this._bestProgress = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  getRemainingBudget(): number {
    return this._maxIterations - this._currentIterations;
  }

  /**
   * @inheritDoc
   */
  getUsedBudget(): number {
    return this._currentIterations;
  }

  /**
   * @inheritDoc
   */
  getTotalBudget(): number {
    return this._maxIterations;
  }

  /**
   * @inheritDoc
   */
  reset(): void {
    this._currentIterations = 0;
    this._bestProgress = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initializationStarted(): void {}

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  initializationStopped(): void {}

  /**
   * @inheritDoc
   */
  searchStarted(): void {
    this._tracking = true;
  }

  /**
   * @inheritDoc
   */
  searchStopped(): void {
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  iteration(searchAlgorithm: SearchAlgorithm<T>): void {
    if (this._tracking && this._currentIterations < this._maxIterations) {
      if (searchAlgorithm.progress > this._bestProgress) {
        this._currentIterations = 0;
      } else {
        this._currentIterations++;
      }
    }
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  evaluation(encoding: T): void {}
}
