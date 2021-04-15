import { EvolutionaryAlgorithm } from "../EvolutionaryAlgorithm";
import { TestCase } from "../../../../testcase/TestCase";
import { EncodingSampler } from "../../../EncodingSampler";
import { EncodingRunner } from "../../../EncodingRunner";
import { UncoveredObjectiveManager } from "../../../objective/managers/UncoveredObjectiveManager";
import { getLogger } from "../../../../util/logger";
import { ObjectiveFunction } from "../../../objective/ObjectiveFunction";
import { crowdingDistance } from "../../../operators/ranking/CrowdingDistance";
import { DominanceComparator } from "../../../comparators/DominanceComparator";

/**
 * Many-objective Sorting Algorithm (MOSA).
 *
 * Based on:
 * Reformulating Branch Coverage as a Many-Objective Optimization Problem
 * A. Panichella; F. K. Kifetew; P. Tonella
 *
 * @author Mitchell Olsthoorn
 * @author Annibale Panichella
 */
export class MOSA extends EvolutionaryAlgorithm {
  constructor(
    encodingSampler: EncodingSampler<TestCase>,
    runner: EncodingRunner<TestCase>
  ) {
    super(new UncoveredObjectiveManager<TestCase>(runner), encodingSampler);
  }

  protected _environmentalSelection(size: number): void {
    // non-dominated sorting
    getLogger().debug(
      "Number of objectives = " +
        this._objectiveManager.getCurrentObjectives().size
    );
    const F = this.preferenceSortingAlgorithm(
      this._population,
      this._objectiveManager.getCurrentObjectives()
    );

    // select new population
    const nextPopulation = [];
    let remain = Math.max(size, F[0].length);
    let index = 0;

    getLogger().debug("First front size = " + F[0].length);

    // Obtain the next front
    let currentFront: TestCase[] = F[index];

    while (remain > 0 && remain >= currentFront.length) {
      // Assign crowding distance to individuals
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

      // Add the individuals of this front
      nextPopulation.push(...currentFront);

      // Decrement remain
      remain = remain - currentFront.length;

      // Obtain the next front
      index++;

      currentFront = F[index];
    }

    // Remain is less than front(index).size, insert only the best one
    if (remain > 0 && currentFront.length > 0) {
      // front contains individuals to insert
      crowdingDistance(
        currentFront,
        this._objectiveManager.getCurrentObjectives()
      );

      currentFront = currentFront.sort(function (a: TestCase, b: TestCase) {
        // sort in descending order of crowding distance
        return b.getCrowdingDistance() - a.getCrowdingDistance();
      });

      for (const individual of currentFront) {
        if (remain == 0) break;

        nextPopulation.push(individual);
        remain--;
      }
    }

    this._population = nextPopulation;
  }

  /**
   * See: Preference sorting as discussed in the TSE paper for DynaMOSA
   *
   * @param population
   * @param objectiveFunctions
   */
  public preferenceSortingAlgorithm(
    population: TestCase[],
    objectiveFunctions: Set<ObjectiveFunction<TestCase>>
  ): TestCase[][] {
    const fronts: TestCase[][] = [[]];

    if (objectiveFunctions === null) {
      getLogger().debug(
        "It looks like a bug in MOSA: the set of objectives cannot be null"
      );
      return fronts;
    }

    if (objectiveFunctions.size === 0) {
      getLogger().debug("Trivial case: no objectives for the sorting");
      return fronts;
    }

    // compute the first front using the Preference Criteria
    const frontZero = this.preferenceCriterion(population, objectiveFunctions);

    for (const individual of frontZero) {
      fronts[0].push(individual);
      individual.setRank(0);
    }

    getLogger().debug("First front size :" + frontZero.length);
    getLogger().debug("Pop size :" + this._populationSize);
    getLogger().debug("Pop + Off size :" + population.length);

    // compute the remaining non-dominated Fronts
    const remainingSolutions: TestCase[] = population;
    for (const selected of frontZero) {
      const index = remainingSolutions.indexOf(selected);
      remainingSolutions.splice(index, 1);
    }

    let selectedSolutions = frontZero.length;
    let frontIndex = 1;

    while (
      selectedSolutions < this._populationSize &&
      remainingSolutions.length != 0
    ) {
      const front: TestCase[] = this.getNonDominatedFront(
        objectiveFunctions,
        remainingSolutions
      );
      fronts[frontIndex] = front;
      for (const solution of front) {
        solution.setRank(frontIndex);
      }

      for (const selected of front) {
        const index = remainingSolutions.indexOf(selected);
        remainingSolutions.splice(index, 1);
      }

      selectedSolutions += front.length;

      frontIndex += 1;
    }

    getLogger().debug("Number of fronts :" + fronts.length);
    getLogger().debug("Front zero size :" + fronts[0].length);
    getLogger().debug("# selected solutions :" + selectedSolutions);
    getLogger().debug("Pop size :" + this._populationSize);
    return fronts;
  }

  /**
   * It retrieves the front of non-dominated solutions from a list
   */
  public getNonDominatedFront(
    uncoveredObjectives: Set<ObjectiveFunction<TestCase>>,
    remainingSolutions: TestCase[]
  ): TestCase[] {
    const front: TestCase[] = [];
    let isDominated: boolean;

    for (const current of remainingSolutions) {
      isDominated = false;
      const dominatedSolutions: TestCase[] = [];
      for (const best of front) {
        const flag = DominanceComparator.compare(
          current,
          best,
          uncoveredObjectives
        );
        if (flag == -1) {
          dominatedSolutions.push(best);
        }
        if (flag == +1) {
          isDominated = true;
        }
      }

      if (isDominated) continue;

      for (const dominated of dominatedSolutions) {
        const index = front.indexOf(dominated);
        front.splice(index, 1);
      }

      front.push(current);
    }
    return front;
  }

  /**
   * Preference criterion in MOSA: for each objective, we select the test case closer to cover it.
   *
   * @param population
   * @param objectives list of objective to consider
   * @protected
   */
  public preferenceCriterion(
    population: TestCase[],
    objectives: Set<ObjectiveFunction<TestCase>>
  ): TestCase[] {
    const frontZero: TestCase[] = [];
    for (const objective of objectives) {
      let chosen = population[0];

      for (let index = 1; index < population.length; index++) {
        if (
          population[index].getObjective(objective) <
          chosen.getObjective(objective)
        )
          // if lower fitness, than it is better
          chosen = population[index];
        else if (
          population[index].getObjective(objective) ==
          chosen.getObjective(objective)
        ) {
          // at the same level of fitness, we look at test case size
          if (population[index].getLength() < chosen.getLength()) {
            // Secondary criterion based on tests lengths
            chosen = population[index];
          }
        }
      }

      // MOSA preference criterion: the best for a target gets Rank 0
      chosen.setRank(0);
      if (!frontZero.includes(chosen)) frontZero.push(chosen);
    }
    return frontZero;
  }
}
