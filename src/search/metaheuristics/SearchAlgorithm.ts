import { Encoding } from "../Encoding";
import { Archive } from "../Archive";
import { SearchSubject } from "../SearchSubject";
import { ObjectiveManager } from "../objective/managers/ObjectiveManager";
import { BudgetManager } from "../budget/BudgetManager";

/**
 * Abstract search algorithm to search for an optimal solution within the search space.
 *
 * The search algorithm is dependent on the encoding of the search space.
 *
 * @author Mitchell Olsthoorn
 */
export abstract class SearchAlgorithm<T extends Encoding<T>> {
  /**
   * Manager that keeps track of which objectives have been covered and are still to be searched.
   * @protected
   */
  protected readonly _objectiveManager: ObjectiveManager<T>;

  /**
   * Abstract constructor.
   *
   * @param objectiveManager Objective manager
   * @protected
   */
  protected constructor(objectiveManager: ObjectiveManager<T>) {
    this._objectiveManager = objectiveManager;
  }

  /**
   * Initialization phase of the search process.
   *
   * @protected
   */
  protected abstract _initialize(): void;

  /**
   * Iteration phase of the search process.
   *
   * @protected
   */
  protected abstract _iterate(): void;

  /**
   * Search the search space for an optimal solution until one of the termination conditions are met.
   *
   * @param subject
   * @param budgetManager
   */
  public async search(
    subject: SearchSubject<T>,
    budgetManager: BudgetManager<T>
  ): Promise<Archive<T>> {
    // Load search subject into the objective manager
    this._objectiveManager.load(subject);

    // Initialize search process
    budgetManager.startInitialization();
    await this._initialize();
    budgetManager.stopInitialization();

    // Search loop that runs until the budget has expired or there are no more objectives
    budgetManager.start();
    while (
      this._objectiveManager.hasObjectives() &&
      budgetManager.hasBudgetLeft()
    ) {
      await this._iterate();
      budgetManager.iteration(this);
    }
    budgetManager.stop();

    // Return the archive of covered objectives
    return this._objectiveManager.getArchive();
  }

  /**
   * Return the progress of the search process.
   */
  public getProgress(): number {
    const numberOfCoveredObjectives = this._objectiveManager.getCoveredObjectives()
      .size;
    const numberOfUncoveredObjectives = this._objectiveManager.getUncoveredObjectives()
      .size;
    return (
      numberOfCoveredObjectives /
      (numberOfCoveredObjectives + numberOfUncoveredObjectives)
    );
  }
}
