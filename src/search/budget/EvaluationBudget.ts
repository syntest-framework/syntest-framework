import { Budget } from "./Budget";
import { Encoding } from "../Encoding";
import { SearchAlgorithm } from "../metaheuristics/SearchAlgorithm";

/**
 * Budget for the number of evaluation performed during the search process.
 *
 * @author Mitchell Olsthoorn
 */
export class EvaluationBudget<T extends Encoding> implements Budget<T> {
  /**
   * The current number of evaluations.
   * @protected
   */
  protected _currentEvaluations: number;

  /**
   * The maximum number of evaluations allowed.
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
  constructor(maxEvaluations = Number.MAX_SAFE_INTEGER) {
    this._currentEvaluations = 0;
    this._maxEvaluations = maxEvaluations;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  getRemainingBudget(): number {
    return this._maxEvaluations - this._currentEvaluations;
  }

  /**
   * @inheritDoc
   */
  getUsedBudget(): number {
    return this._currentEvaluations;
  }

  /**
   * @inheritDoc
   */
  getTotalBudget(): number {
    return this._maxEvaluations;
  }

  /**
   * @inheritDoc
   */
  reset(): void {
    this._currentEvaluations = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  initializationStarted(): void {
    this._tracking = true;
  }

  /**
   * @inheritDoc
   */
  initializationStopped(): void {
    this._tracking = false;
  }

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
  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  iteration(searchAlgorithm: SearchAlgorithm<T>): void {}

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  evaluation(encoding: T): void {
    if (this._tracking && this._currentEvaluations < this._maxEvaluations) {
      this._currentEvaluations++;
    }
  }
}
