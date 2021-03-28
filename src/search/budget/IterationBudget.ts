import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Budget for the number of iterations performed during the search process.
 */
export class IterationBudget<T extends Encoding<T>> implements Budget<T> {
  /**
   * The current number of iterations.
   * @protected
   */
  protected _currentIterations: number;

  /**
   * The maximum number of iterations.
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
  constructor(maxIterations: number) {
    this._currentIterations = 0;
    this._maxIterations = maxIterations;
  }

  evaluation(encoding: T): void {}

  getAvailableBudget(): number {
    return this._maxIterations - this._currentIterations;
  }

  getCurrentBudget(): number {
    return this._currentIterations;
  }

  getTotalBudget(): number {
    return this._maxIterations;
  }

  iteration(searchAlgorithm: SearchAlgorithm<T>): void {
    if (this._tracking && this._currentIterations <= this._maxIterations) {
      this._currentIterations++;
    }
  }

  reset(): void {
    this._currentIterations = 0;
  }

  start(): void {
    this._tracking = true;
  }

  startInitialization(): void {}

  stop(): void {
    this._tracking = false;
  }

  stopInitialization(): void {}
}
