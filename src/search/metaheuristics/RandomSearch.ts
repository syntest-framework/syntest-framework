import { SearchAlgorithm } from "./SearchAlgorithm";
import { Encoding } from "../Encoding";
import { EncodingSampler } from "../EncodingSampler";
import { SimpleObjectiveManager } from "../objective/managers/SimpleObjectiveManager";
import { EncodingRunner } from "../EncodingRunner";
import { BudgetManager } from "../budget/BudgetManager";

/**
 * Random Search algorithm that adds new encodings when these explore a new area of the search domain.
 *
 * @author Mitchell Olsthoorn
 */
export class RandomSearch<T extends Encoding> extends SearchAlgorithm<T> {
  protected _encodingSampler: EncodingSampler<T>;

  /**
   * Constructor.
   *
   * @param encodingSampler
   * @param runner
   */
  constructor(encodingSampler: EncodingSampler<T>, runner: EncodingRunner<T>) {
    const objectiveManager = new SimpleObjectiveManager<T>(runner);
    super(objectiveManager);
    this._encodingSampler = encodingSampler;
  }

  /**
   * @inheritDoc
   * @protected
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _initialize(budgetManager: BudgetManager<T>): void {}

  /**
   * @inheritDoc
   * @protected
   */
  protected async _iterate(budgetManager: BudgetManager<T>): Promise<void> {
    // Sample a new random encoding
    const randomEncoding: T = this._encodingSampler.sample();

    // Evaluate the new encoding
    await this._objectiveManager.evaluateOne(randomEncoding, budgetManager);
  }
}
