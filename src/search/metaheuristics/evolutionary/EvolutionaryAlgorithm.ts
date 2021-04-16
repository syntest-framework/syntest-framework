import { SearchAlgorithm } from "../SearchAlgorithm";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { EncodingSampler } from "../../EncodingSampler";
import { getProperty } from "../../../config";
import { tournamentSelection } from "../../operators/selection/TournamentSelection";
import { TreeCrossover } from "../../operators/crossover/TreeCrossover";
import { TestCase } from "../../../testcase/TestCase";
import { prng } from "../../../util/prng";
import { BudgetManager } from "../../budget/BudgetManager";

/**
 * Base class for Evolutionary Algorithms (EA).
 * Uses the TestCase encoding.
 */
export abstract class EvolutionaryAlgorithm extends SearchAlgorithm<TestCase> {
  /**
   * The sampler used to sample new encodings.
   * @protected
   */
  protected _encodingSampler: EncodingSampler<TestCase>;

  /**
   * The population of the EA.
   * This population is evolved over time and becomes more optimized.
   * @protected
   */
  protected _population: TestCase[];

  /**
   * The size of the population.
   * @protected
   */
  protected _populationSize: number;

  /**
   * Constructor.
   *
   * @param objectiveManager The objective manager used by the specific algorithm
   * @param encodingSampler The encoding sampler used by the specific algorithm
   * @protected
   */
  protected constructor(
    objectiveManager: ObjectiveManager<TestCase>,
    encodingSampler: EncodingSampler<TestCase>
  ) {
    super(objectiveManager);
    this._encodingSampler = encodingSampler;
    this._population = [];
    this._populationSize = getProperty("population_size");
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _initialize(
    budgetManager: BudgetManager<TestCase>
  ): Promise<void> {
    for (let i = 0; i < getProperty("population_size"); i++) {
      this._population.push(this._encodingSampler.sample());
    }

    // Evaluate initial population before starting the search loop
    await this._objectiveManager.evaluateMany(this._population, budgetManager);

    // compute ranking and crowding distance
    this._environmentalSelection(this._populationSize);
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _iterate(
    bugetManager: BudgetManager<TestCase>
  ): Promise<void> {
    const offspring = this._generateOffspring();
    await this._objectiveManager.evaluateMany(offspring, bugetManager);

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
  protected _generateOffspring(): TestCase[] {
    const offspring = [];

    const rounds = Math.max(2, Math.round(this._populationSize / 5));

    while (offspring.length < this._populationSize) {
      const parentA = tournamentSelection(this._population, rounds);
      const parentB = tournamentSelection(this._population, rounds);

      if (prng.nextDouble(0, 1) <= getProperty("crossover_probability")) {
        const [childA, childB] = TreeCrossover(parentA, parentB);

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
