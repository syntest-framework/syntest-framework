import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Budget for the number of evaluation performed during the search process.
 */
export class EvaluationBudget<T extends Encoding<T>> implements Budget<T> {
  /**
   * The current number of evaluations.
   * @protected
   */
  protected _currentEvaluations: number;

  /**
   * The maximum number of evaluations.
   * @protected
   */
  protected readonly _maxEvaluations: number;

  /**
   * If the budget is tracking progress
   * @protected
   */
  protected _tracking: boolean;

  /**
   * Constructor.
   *
   * @param maxEvaluations The maximum number of evaluations of this budget
   */
  constructor(maxEvaluations: number) {
    this._currentEvaluations = 0;
    this._maxEvaluations = maxEvaluations;
  }

  evaluation(encoding: T): void {
    if (this._tracking && this._currentEvaluations <= this._maxEvaluations) {
      this._currentEvaluations++;
    }
  }

  getAvailableBudget(): number {
    return this._maxEvaluations - this._currentEvaluations;
  }

  getCurrentBudget(): number {
    return this._currentEvaluations;
  }

  getTotalBudget(): number {
    return this._maxEvaluations;
  }

  iteration(searchAlgorithm: SearchAlgorithm<T>): void {}

  reset(): void {
    this._currentEvaluations = 0;
  }

  start(): void {
    this._tracking = true;
  }

  startInitialization(): void {
    this._tracking = true;
  }

  stop(): void {
    this._tracking = false;
  }

  stopInitialization(): void {
    this._tracking = false;
  }
}
