import { SearchAlgorithm } from "../SearchAlgorithm";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { EncodingSampler } from "../../EncodingSampler";
import { getProperty } from "../../../config";
import { tournamentSelection } from "../../operators/selection/TournamentSelection";
import { TreeCrossover } from "../../operators/crossover/TreeCrossover";
import { TestCase } from "../../../testcase/TestCase";

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
  protected async _initialize(): Promise<void> {
    for (let i = 0; i < getProperty("population_size"); i++) {
      this._population.push(this._encodingSampler.sample());
    }

    // Evaluate initial population before starting the search loop
    await this._objectiveManager.evaluateMany(this._population);
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _iterate(): Promise<void> {
    const offspring = this._generateOffspring();
    await this._objectiveManager.evaluateMany(offspring);

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

    // TODO: doesn't work for odd population sizes
    for (let index = 0; index < this._populationSize / 2; index++) {
      const parentA = tournamentSelection(this._population, 2);
      const parentB = tournamentSelection(this._population, 2);
      const [childA, childB] = TreeCrossover(parentA, parentB);

      offspring.push(childA.mutate(this._encodingSampler));
      offspring.push(childB.mutate(this._encodingSampler));
    }

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
