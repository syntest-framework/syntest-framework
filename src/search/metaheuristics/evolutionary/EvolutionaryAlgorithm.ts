import { SearchAlgorithm } from "../SearchAlgorithm";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { EncodingSampler } from "../../EncodingSampler";
import { getProperty } from "../../../config";
import { tournamentSelection } from "../../operators/selection/TournamentSelection";
import { TreeCrossover } from "../../operators/crossover/TreeCrossover";
import { TestCase } from "../../../testcase/TestCase";

export abstract class EvolutionaryAlgorithm extends SearchAlgorithm<TestCase> {
  protected _encodingSampler: EncodingSampler<TestCase>;
  protected _population: TestCase[];
  protected _populationSize: number;

  protected constructor(
    objectiveManager: ObjectiveManager<TestCase>,
    encodingSampler: EncodingSampler<TestCase>
  ) {
    super(objectiveManager);
    this._encodingSampler = encodingSampler;
    this._population = [];
    this._populationSize = getProperty("population_size");
  }

  protected _initialize(): void {
    for (let i = 0; i < getProperty("population_size"); i++) {
      this._population.push(this._encodingSampler.sample());
    }
  }

  protected async _iterate(): Promise<void> {
    const offspring = this._generateOffspring(this._populationSize);
    await this._objectiveManager.evaluateMany(offspring);

    // If all objectives are covered, we don't need to rank the population anymore
    // The final test cases are in the archive, rather than the population
    if (!this._objectiveManager.hasObjectives()) {
      return;
    }

    this._population.push(...offspring);
    this._environmentalSelection(this._populationSize);
  }

  protected _generateOffspring(population_size: number): TestCase[] {
    const offspring = [];

    // TODO: doesn't work for odd population sizes
    for (let index = 0; index < population_size / 2; index++) {
      const parentA = tournamentSelection(this._population, 2);
      const parentB = tournamentSelection(this._population, 2);
      const [childA, childB] = TreeCrossover(parentA, parentB);

      offspring.push(childA.mutate(this._encodingSampler));
      offspring.push(childB.mutate(this._encodingSampler));
    }

    return offspring;
  }

  protected abstract _environmentalSelection(population_size: number): void;
}
