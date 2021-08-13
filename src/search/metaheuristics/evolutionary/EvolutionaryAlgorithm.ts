import { SearchAlgorithm } from "../SearchAlgorithm";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { EncodingSampler } from "../../EncodingSampler";
import { tournamentSelection } from "../../operators/selection/TournamentSelection";
import { Crossover } from "../../operators/crossover/Crossover";
import { AbstractTestCase } from "../../../testcase/AbstractTestCase";
import { prng } from "../../../util/prng";
import { BudgetManager } from "../../budget/BudgetManager";
import { Properties } from "../../../properties";
import { TerminationManager } from "../../termination/TerminationManager";

/**
 * Base class for Evolutionary Algorithms (EA).
 * Uses the AbstractTestCase encoding.
 */
export abstract class EvolutionaryAlgorithm extends SearchAlgorithm<AbstractTestCase> {
  /**
   * The sampler used to sample new encodings.
   * @protected
   */
  protected _encodingSampler: EncodingSampler<AbstractTestCase>;

  /**
   * The population of the EA.
   * This population is evolved over time and becomes more optimized.
   * @protected
   */
  protected _population: AbstractTestCase[];

  /**
   * The size of the population.
   * @protected
   */
  protected _populationSize: number;

  protected _crossover: Crossover;

  /**
   * Constructor.
   *
   * @param objectiveManager The objective manager used by the specific algorithm
   * @param encodingSampler The encoding sampler used by the specific algorithm
   * @param crossover The crossover operator to apply
   * @protected
   */
  protected constructor(
    objectiveManager: ObjectiveManager<AbstractTestCase>,
    encodingSampler: EncodingSampler<AbstractTestCase>,
    crossover: Crossover
  ) {
    super(objectiveManager);
    this._encodingSampler = encodingSampler;
    this._population = [];
    this._populationSize = Properties.population_size;
    this._crossover = crossover;
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _initialize(
    budgetManager: BudgetManager<AbstractTestCase>,
    terminationManager: TerminationManager
  ): Promise<void> {
    for (let i = 0; i < Properties.population_size; i++) {
      this._population.push(this._encodingSampler.sample());
    }

    // Evaluate initial population before starting the search loop
    await this._objectiveManager.evaluateMany(
      this._population,
      budgetManager,
      terminationManager
    );

    // Compute ranking and crowding distance
    this._environmentalSelection(this._populationSize);
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _iterate(
    budgetManager: BudgetManager<AbstractTestCase>,
    terminationManager: TerminationManager
  ): Promise<void> {
    const offspring = this._generateOffspring();
    await this._objectiveManager.evaluateMany(
      offspring,
      budgetManager,
      terminationManager
    );

    // If all objectives are covered, we don't need to rank the population anymore
    // The final test cases are in the archive, rather than the population
    if (!this._objectiveManager.hasObjectives()) {
      return;
    }

    this._population.push(...offspring);
    this._environmentalSelection(this._populationSize);
  }

  /**
   * Generates offspring based on the current population.
   *
   * @protected
   */
  protected _generateOffspring(): AbstractTestCase[] {
    const offspring = [];

    const rounds = Math.max(2, Math.round(this._populationSize / 5));

    while (offspring.length < this._populationSize) {
      const parentA = tournamentSelection(this._population, rounds);
      const parentB = tournamentSelection(this._population, rounds);

      if (prng.nextDouble(0, 1) <= Properties.crossover_probability) {
        const [childA, childB] = this._crossover.crossOver(parentA, parentB);

        const testCase1 = childA.copy().mutate(this._encodingSampler);
        offspring.push(testCase1);

        const testCase2 = childB.copy().mutate(this._encodingSampler);
        offspring.push(testCase2);
      } else {
        offspring.push(parentA.copy().mutate(this._encodingSampler));
        offspring.push(parentB.copy().mutate(this._encodingSampler));
      }
    }
    offspring.push(this._encodingSampler.sample());
    return offspring;
  }

  /**
   * Makes a selection of the population based on the environment.
   *
   * @param size The size of the selection
   * @protected
   */
  protected abstract _environmentalSelection(size: number): void;
}
