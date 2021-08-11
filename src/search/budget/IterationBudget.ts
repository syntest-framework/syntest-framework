import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Budget for the number of iterations performed during the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class IterationBudget<T extends Encoding> implements Budget<T> {
  /**
   * The current number of iterations.
   * @protected
   */
  protected _currentIterations: number;

  /**
   * The maximum number of iterations allowed.
   * @protected
   */
  protected readonly _maxIterations: number;

  /**
   * If the budget is tracking progress
   * @protected
   */
  protected _tracking: boolean;

  /**
   * Constructor.
   *
   * @param maxIterations The maximum number of iterations of this budget
   */
  constructor(maxIterations = Number.MAX_SAFE_INTEGER) {
    this._currentIterations = 0;
    this._maxIterations = maxIterations;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  iteration(searchAlgorithm: SearchAlgorithm<T>): void {
    if (this._tracking && this._currentIterations < this._maxIterations) {
      this._currentIterations++;
    }
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  evaluation(encoding: T): void {}
}
