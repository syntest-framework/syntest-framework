import { TestCase } from "../../../testcase/TestCase";
import { EvolutionaryAlgorithm } from "./EvolutionaryAlgorithm";
import { crowdingDistance } from "../../operators/ranking/CrowdingDistance";
import { fastNonDomSorting } from "../../operators/ranking/FastNonDomSorting";
import { EncodingSampler } from "../../EncodingSampler";
import { getProperty } from "../../../config";
import { SimpleObjectiveManager } from "../../objective/managers/SimpleObjectiveManager";
import { EncodingRunner } from "../../EncodingRunner";

/**
 * Fast Elitist Non-dominated Sorting Genetic Algorithm (NSGA-II)
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
export class NSGAII extends EvolutionaryAlgorithm {
  constructor(
    encodingSampler: EncodingSampler<TestCase>,
    runner: EncodingRunner<TestCase>
  ) {
    super(new SimpleObjectiveManager<TestCase>(runner), encodingSampler);
  }

  protected _environmentalSelection(population_size: number): void {
    const fronts = fastNonDomSorting(
      this._population,
      this._objectiveManager.getCurrentObjectives()
    );
    const nextPopulation = [];
    let remain = population_size;
    let index = 0;
    let currentFront = fronts[index];
    while (
      remain > 0 &&
      remain >= currentFront.length &&
      !currentFront.length
    ) {
      // Assign crowding distance to individuals
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

      // Add the individuals of this front
      for (const individual of currentFront) {
        if (nextPopulation.length < population_size) {
          nextPopulation.push(individual);
        }
      }

      // Decrement remain
      remain = remain - currentFront.length;

      // Obtain the next front
      index++;
      if (remain > 0) {
        currentFront = fronts[index];
      }
    }

    // Remain is less than front(index).size, insert only the best one
    if (remain > 0 && currentFront.length > 0) {
      // front contains individuals to insert
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

      currentFront.sort(function (a: TestCase, b: TestCase) {
        // sort in descending order of crowding distance
        return b.getCrowdingDistance() - a.getCrowdingDistance();
      });
      let counter = 0;
      for (const individual of currentFront) {
        if (counter > remain) break;

        nextPopulation.push(individual);
        counter++;
      }
    }

    this._population = nextPopulation;
  }
}
