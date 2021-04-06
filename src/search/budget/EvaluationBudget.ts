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
  public constructor(maxEvaluations: number) {
    this._currentEvaluations = 0;
    this._maxEvaluations = maxEvaluations;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public evaluation(encoding: T): void {
    if (this._tracking && this._currentEvaluations < this._maxEvaluations) {
      this._currentEvaluations++;
    }
  }

  /**
   * @inheritDoc
   */
  public getAvailableBudget(): number {
    return this._maxEvaluations - this._currentEvaluations;
  }

  /**
   * @inheritDoc
   */
  public getCurrentBudget(): number {
    return this._currentEvaluations;
  }

  /**
   * @inheritDoc
   */
  public getTotalBudget(): number {
    return this._maxEvaluations;
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
    this._currentEvaluations = 0;
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  public start(): void {
    this._tracking = true;
  }

  /**
   * @inheritDoc
   */
  public startInitialization(): void {
    this._tracking = true;
  }

  /**
   * @inheritDoc
   */
  public stop(): void {
    this._tracking = false;
  }

  /**
   * @inheritDoc
   */
  public stopInitialization(): void {
    this._tracking = false;
  }
}
