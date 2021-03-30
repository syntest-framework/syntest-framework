import { SearchAlgorithm } from "./SearchAlgorithm";
import { Encoding } from "../Encoding";
import { EncodingSampler } from "../EncodingSampler";
import { SimpleObjectiveManager } from "../objective/managers/SimpleObjectiveManager";
import { EncodingRunner } from "../EncodingRunner";

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
  }

  /**
   * Initialization phase of the search process.
   *
   * @protected
   */
  protected _initialize(): void {}

  /**
   * Iteration phase of the search process.
   *
   * @protected
   */
  protected async _iterate(): Promise<void> {
    // Sample a new random encoding
    const randomEncoding: T = this._encodingSampler.sample();

    // Evaluate the new encoding
    await this._objectiveManager.evaluateOne(randomEncoding);
  }
}
