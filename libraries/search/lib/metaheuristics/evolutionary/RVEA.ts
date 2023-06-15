/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { getLogger, Logger } from "@syntest/logging";

import { BudgetManager } from "../../budget/BudgetManager";
import { Encoding } from "../../Encoding";
import { EncodingSampler } from "../../EncodingSampler";
import { ObjectiveManager } from "../../objective/managers/ObjectiveManager";
import { ObjectiveFunction } from "../../objective/ObjectiveFunction";
import { Procreation } from "../../operators/procreation/Procreation";
import { TerminationManager } from "../../termination/TerminationManager";
import { shouldNeverHappen } from "../../util/diagnostics";
import { SearchAlgorithm } from "../SearchAlgorithm";

export class RVEA<T extends Encoding> extends SearchAlgorithm<T> {
  /**
   * The sampler used to sample new encodings.
   * @protected
   */
  protected _encodingSampler: EncodingSampler<T>;

  /**
   * The population of the EA.
   * This population is evolved over time and becomes more optimized.
   * @protected
   */
  protected _population: T[];

  /**
   * The size of the population.
   * @protected
   */
  protected _populationSize: number;

  /**
   * The procreation operator to apply.
   */
  protected _procreation: Procreation<T>;

  protected static override LOGGER: Logger;
  protected weights_: number[][];
  protected weights: number[][];
  protected neighbours: number[];

  /**
   * Constructor.
   *
   * @param objectiveManager The objective manager used by the specific algorithm
   * @param encodingSampler The encoding sampler used by the specific algorithm
   * @param crossover The crossover operator to apply
   *
   */
  constructor(
    objectiveManager: ObjectiveManager<T>,
    encodingSampler: EncodingSampler<T>,
    procreation: Procreation<T>,
    populationSize: number
  ) {
    super(objectiveManager);
    this._encodingSampler = encodingSampler;
    this._procreation = procreation;
    this._populationSize = populationSize;

    this._population = [];

    RVEA.LOGGER = getLogger("RVEA");
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected async _initialize(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Promise<void> {
    for (let index = 0; index < this._populationSize; index++) {
      this._population.push(this._encodingSampler.sample());
    }

    // Evaluate initial population before starting the search loop
    await this._objectiveManager.evaluateMany(
      this._population,
      budgetManager,
      terminationManager
    );

    const M = this._objectiveManager.getCurrentObjectives().size;
    RVEA.LOGGER.debug(
      `_initialize method has found ${M} objectives in the objectiveManager.`
    );
    //TODO: Throw that M can not be 0 exception.
    const number_of_reference_vectors = Math.max(M * 2, this._populationSize);
    RVEA.LOGGER.debug(
      `_initialize method decided to create ${number_of_reference_vectors} reference vectors.`
    );
    this.weights_ = this.referenceVectors(
      this.referencePoints(M, number_of_reference_vectors)
    );
    RVEA.LOGGER.debug(`_initialize stopped`);

    // Compute ranking and crowding distance
    //TODO: This is not needed for my algorithm?
    // this._environmentalSelection(this._populationSize);
  }

  /**
   * @inheritDoc
   * @protected
   */
  protected override async _iterate(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Promise<void> {
    const offspring = this._procreation.generateOffspringPopulation(
      this._populationSize,
      this._population
    );

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
    const alpha = 2;
    const progress = 1 - budgetManager.getBudget() / 100; // t/t_max
    RVEA.LOGGER.debug(
      `_iterate method has following current progress ${progress}.`
    );
    const fr = 0.2;
    this._environmentalSelection(this._populationSize, alpha, progress, fr);
  }

  /**
   * Makes a selection of the population based on the environment.
   *
   * @param size The size of the selection
   * @param M The number of objectives. I.E. dimension of the objective space
   * @param alpha The hyperparameter controlling the rate of change of APD's penalty function
   * @param progress The progress of the search from 0 (start) to 1 (finish) I.E. t/t_max
   * @param fr The hyperparameter controlling the frequency of applying reference vector adaptation
   * @protected
   */
  protected _environmentalSelection(
    size: number,
    alpha: number,
    progress: number,
    fr: number
  ): void {
    const M = this._objectiveManager.getCurrentObjectives().size;
    const population = this._population;
    const objectiveFunctions = this._objectiveManager.getCurrentObjectives();

    const numberOfReferenceVectors = Math.max(M * 2, size);
    this.weights = this.referenceVectors(
      this.referencePoints(M, numberOfReferenceVectors)
    );
    this.neighbours = this.nearestNeighbors(this.weights);

    const nextPopulation = this.referenceVectorGuidedSelection(
      M,
      population,
      objectiveFunctions,
      this.weights,
      this.neighbours,
      size,
      progress,
      alpha,
      false
    )[0];

    RVEA.LOGGER.debug(
      `The referenceVectorGuidesSelection produced a population of the size ${nextPopulation.length}.`
    );

    //Reference Vector Adaptation
    if (progress % fr === 0 && progress !== 0) {
      const { newWeights, newNeighbours } = this.adaptation(
        nextPopulation,
        objectiveFunctions,
        this.weights_
      );
      this.weights = newWeights;
      this.neighbours = newNeighbours;
      RVEA.LOGGER.debug(`Reference Vector Adaptation was performed`);
    }

    // Assign crowding distance and rank as 0.
    for (const individual of nextPopulation) {
      individual.setRank(0);
      individual.setCrowdingDistance(0);
    }

    this._population = nextPopulation;
  }

  protected referenceVectorGuidedSelection(
    M: number,
    population: T[],
    objectiveFunctions: Set<ObjectiveFunction<T>>,
    weights: number[][],
    neighbours: number[],
    size: number,
    progress: number,
    alpha: number,
    multipleFronts: boolean
  ): T[][] {
    const apdValues: number[][] = [];

    const minValuesOfObjectives = this.objectiveValueTranslation(
      population,
      objectiveFunctions
    );

    RVEA.LOGGER.debug(
      `[referenceVectorGuidedSelection] Objective Value Translation was performed, a minimum value for ${minValuesOfObjectives.size} objectives was found.`
    );

    const { niche, arccosine, normsOfIndividuals } = this.populationPartition(
      population,
      objectiveFunctions,
      weights
    );

    RVEA.LOGGER.debug(
      `[referenceVectorGuidedSelection] Population Partition is performed and a niche of size ${niche.size} is created.`
    );
    RVEA.LOGGER.debug(
      `[referenceVectorGuidedSelection] Population Partition is performed and a arccosine array of size ${arccosine.length} is created.`
    );
    RVEA.LOGGER.debug(
      `[referenceVectorGuidedSelection] Population Partition is performed and a normsOfIndividuals of size ${normsOfIndividuals.length} is created.`
    );

    // APD Calculation and Elitism Selection
    for (const [index, subpopulation] of niche.entries()) {
      if (subpopulation.length > 0) {
        RVEA.LOGGER.debug(
          `[referenceVectorGuidedSelection] Subpopulation with index ${index} has ${subpopulation.length} individuals.`
        );
        const apd = subpopulation.map((individual) =>
          this.apdCalculation(
            arccosine,
            individual,
            index,
            neighbours,
            M,
            progress,
            alpha,
            normsOfIndividuals
          )
        );
        const apdSorted = apd
          .map((value, index) => [value, index])
          .sort((a, b) => a[0] - b[0]);
        apdValues.push(
          apdSorted.map((apdIndexTuple) => subpopulation[apdIndexTuple[1]])
        );
        // RVEA.LOGGER.debug(`[referenceVectorGuidedSelection] APD for subpopulation ${index} was calculated and stored.`);
        RVEA.LOGGER.debug(
          `[referenceVectorGuidedSelection] The index of the individuals with the minimum APD in the subpopulation ${index} is ${
            subpopulation[apdSorted[0][1]]
          }.`
        );
      }
    }

    const front = this.frontFormation(
      population,
      apdValues,
      minValuesOfObjectives
    );
    const F = [front];
    RVEA.LOGGER.debug(
      `[referenceVectorGuidedSelection] First front was created with size ${front.length}.`
    );

    if (multipleFronts) {
      let numberOfFronts = Math.max(
        ...apdValues.map((subpopulation) => subpopulation.length)
      );
      RVEA.LOGGER.debug(
        `[referenceVectorGuidedSelection] At most ${numberOfFronts} extra front can be created, (multipleFronts).`
      );
      while (numberOfFronts !== 0) {
        const nextFront: T[] = this.frontFormation(
          population,
          apdValues,
          minValuesOfObjectives
        );
        F.push(nextFront);
        RVEA.LOGGER.debug(
          `[referenceVectorGuidedSelection] Front ${F.length} was created with ${nextFront.length} individuals, (multipleFronts).`
        );
        numberOfFronts = numberOfFronts - 1;
      }
    }
    return F;
  }

  protected frontFormation(
    population: T[],
    apdValues: number[][],
    minValuesOfObjectives: Map<ObjectiveFunction<T>, number>
  ) {
    const front: T[] = [];
    // RVEA.LOGGER.debug(`[frontFormation] Start front formation function.`);
    for (const individuals of apdValues) {
      if (individuals.length > 0) {
        front.push(population[individuals.splice(0, 1)[0]]);
      }
    }

    // Undo translation
    //TODO: Should undo the the entire population or it is unnecessary computation since some are gone?
    for (const individual of front) {
      for (const [objective, z_min] of minValuesOfObjectives) {
        const undo_translation = individual.getDistance(objective) + z_min;
        individual.setDistance(objective, undo_translation);
      }
    }
    // RVEA.LOGGER.debug(`[frontFormation] End front formation function, including undo translation.`);
    return front;
  }

  /**
   * Perform objective value translation.
   * Described in:
   * A Reference Vector Guided Evolutionary Algorithm for Many-Objective Optimization
   * R. Cheng; Y. Jin; M. Olhofer; B. Sendhoff
   *
   * return a map of smallest values for each objective, so that the translation can be at the end of environmental selection.
   */
  public objectiveValueTranslation(
    population: T[],
    objectiveFunctions: Set<ObjectiveFunction<T>>
  ): Map<ObjectiveFunction<T>, number> {
    const minValuesOfObjectives: Map<ObjectiveFunction<T>, number> = new Map<
      ObjectiveFunction<T>,
      number
    >();

    // RVEA.LOGGER.debug(`[objectiveValueTranslation] Start with ${objectiveFunctions.size} objective functions in the manager.`);

    for (const objective of objectiveFunctions) {
      // RVEA.LOGGER.debug(`[objectiveValueTranslation] Start translation of the objective ${objective.getIdentifier()}.`);
      let min = population[0].getDistance(objective);

      for (const individual of population) {
        const currentValue = individual.getDistance(objective);
        if (currentValue < min) {
          min = currentValue;
        }
      }

      // RVEA.LOGGER.debug(`[objectiveValueTranslation] The min value of the objective ${objective.getIdentifier()} is ${min}.`);

      minValuesOfObjectives.set(objective, min);

      for (const individual of population) {
        const translated = individual.getDistance(objective) - min;
        individual.setDistance(objective, translated);
      }
      // RVEA.LOGGER.debug(`[objectiveValueTranslation] Finish translation of the objective ${objective.getIdentifier()}.`);
    }
    // RVEA.LOGGER.debug(`[objectiveValueTranslation] End.`);
    return minValuesOfObjectives;
  }

  /**
   * Perform population partition.
   *
   * Described in:
   * A Reference Vector Guided Evolutionary Algorithm for Many-Objective Optimization
   * R. Cheng; Y. Jin; M. Olhofer; B. Sendhoff
   *
   * @param weights The array of reference vectors that split the objective space into subspaces.
   *
   * return:
   * - a mapping between the indexes of individuals in a population and the subspace in which they belong. Used for elitism selection.
   * - a 2D array (arccosine[individuals][angle between individual and weight])
   *      which stores the angle to all reference vectors for each individual [[angle1, angle2, ...],[angle1, angle2, ...],...].
   *      Used for APD calculation
   * - an array of norms for each individual which is used in APD calculation for normalisation. Use for APD calculation.
   */
  public populationPartition(
    population: T[],
    objectiveFunctions: Set<ObjectiveFunction<T>>,
    weights: number[][]
  ): {
    niche: Map<number, number[]>;
    arccosine: number[][];
    normsOfIndividuals: number[];
  } {
    // Using maps to make sure that Encoding-value pairs are correct.
    const niche: Map<number, number[]> = new Map<number, number[]>();
    const arccosine: number[][] = [];
    // Initialise niche map.
    for (const [index] of weights.entries()) {
      niche.set(index, []);
    }

    // RVEA.LOGGER.debug(`[populationPartition] Start.`);

    // Calculate the normalisation for each individual.
    const normsOfIndividuals: number[] = population.map((individual) => {
      let sum = 0;
      for (const objective of objectiveFunctions) {
        sum += Math.pow(individual.getDistance(objective), 2);
      }
      return Math.sqrt(sum);
    });
    // For each individual we need to calculate the angle to all reference vectors and find the smallest.
    for (const [indexOfIndividual, individual] of population.entries()) {
      const vectorOfIndividual: number[] = [];
      const arccosValuesOfIndividual: number[] = [];
      for (const objective of objectiveFunctions) {
        vectorOfIndividual.push(individual.getDistance(objective));
      }
      let cosineMax =
        this.vectorMultiplication(vectorOfIndividual, weights[0]) /
        (normsOfIndividuals[indexOfIndividual] + 1e-21);
      let indexMax = 0;

      for (const [index, referenceVector] of weights.entries()) {
        const cosineValue =
          this.vectorMultiplication(vectorOfIndividual, referenceVector) /
          (normsOfIndividuals[indexOfIndividual] + 1e-21);
        const clipedCosineValue = Math.max(Math.min(cosineValue, 1), 0);
        arccosValuesOfIndividual.push(Math.acos(clipedCosineValue));

        if (cosineValue > cosineMax) {
          cosineMax = cosineValue;
          indexMax = index;
        }
      }

      // Update niche
      const subpopulation = niche.get(indexMax);
      subpopulation.push(indexOfIndividual);
      niche.set(indexMax, subpopulation);

      arccosine.push(arccosValuesOfIndividual);
    }

    // RVEA.LOGGER.debug(`[populationPartition] End.`);

    return {
      niche: niche,
      arccosine: arccosine,
      normsOfIndividuals: normsOfIndividuals,
    };
  }

  /**
   * Perform APD calculation.
   *
   * Described in:
   * A Reference Vector Guided Evolutionary Algorithm for Many-Objective Optimization
   * R. Cheng; Y. Jin; M. Olhofer; B. Sendhoff
   *
   * @param arccosine a 2D array which stores the angle to all reference vectors for each individual
   * @param individual an index of an individual in the population for which we are calculating the APD
   * @param index an index of a reference vector (subspace) which we are considering
   * @param neighbours an array of smallest values between reference vectors
   * @param M The number of objectives. I.E. dimension of the objective space
   * @param progress The progress of the search from 0 (start) to 1 (finish) I.E. t/t_max
   * @param alpha The hyperparameter controlling the rate of change of APD's penalty function
   * @param normsOfIndividuals an array of norms for each individual which is used in APD calculation for normalisation.
   *
   * return APD value
   */
  public apdCalculation(
    arccosine: number[][],
    individual: number,
    index: number,
    neighbours: number[],
    M: number,
    progress: number,
    alpha: number,
    normsOfIndividuals: number[]
  ): number {
    const arcCosineOfIndividual =
      arccosine[individual][index] / neighbours[index];
    const p = M * Math.pow(progress, alpha) * arcCosineOfIndividual;
    return (1 + p) * normsOfIndividuals[individual];
  }

  /**
   * Perform a dot product between two vectors.
   *
   * @param v1 vector on the left side
   * @param v2 vector on the right side
   * @private
   *
   * return dot product of two (elementwise multiplication, then summation) vectors.
   */
  private vectorMultiplication(v1: number[], v2: number[]): number {
    // TODO: Check that the vectors are of the same size.
    if (v1.length !== v2.length) {
      RVEA.LOGGER.debug(
        `[vectorMultiplication] Sizes of vectors do not match.`
      );
    }
    let sum = 0;
    for (const [index, element] of v1.entries()) {
      sum += element * v2[index];
    }
    return sum;
  }

  /**
   * Compute the angle of the nearest neighbour of each reference vector.
   *
   * Described in:
   * A Reference Vector Guided Evolutionary Algorithm for Many-Objective Optimization
   * R. Cheng; Y. Jin; M. Olhofer; B. Sendhoff
   *
   * @param referenceVectors a 2D array of reference vectors
   *
   * return an array of smallest values between reference vectors
   */
  public nearestNeighbors(referenceVectors: number[][]): number[] {
    const output: number[] = [];

    for (const vector1 of referenceVectors) {
      const sortedCosine: number[] = [];
      for (const vector2 of referenceVectors) {
        sortedCosine.push(-1 * this.vectorMultiplication(vector1, vector2));
      }
      sortedCosine.sort((a, b) => a - b);
      const clipVector: number = Math.max(Math.min(-1 * sortedCosine[1], 1), 0);
      output.push(Math.acos(clipVector));
    }
    return output;
  }

  // Source: https://github.com/Valdecy/pyMultiobjective/blob/0c72fc293726d76352d51875374f2327aa6d122b/pyMultiobjective/algorithm/rvea.py
  /**
   *
   * @param referencePoints
   */
  public referenceVectors(referencePoints: number[][]): number[][] {
    return referencePoints.map((value, index, array) =>
      array[index].map(
        (points) => points / Math.sqrt(value.reduce((x, y) => x + y ** 2, 0))
      )
    );
    // const output: number[][] = [];
    // let sum = 0;
    // for (const vector of referencePoints) {
    //     for (const element of vector) {
    //         sum += Math.pow(Math.abs(element), 2);
    //     }
    // }
    // sum = Math.sqrt(sum);
    // for (const vector of referencePoints) {
    //     const unitVector: number[] = [];
    //     for (const element of vector) {
    //         unitVector.push(element / sum);
    //     }
    //     output.push(unitVector);
    // }
    // return output;
  }

  // Source: https://github.com/Valdecy/pyMultiobjective/blob/0c72fc293726d76352d51875374f2327aa6d122b/pyMultiobjective/algorithm/rvea.py
  /**
   *
   * @param M
   * @param p
   */
  public referencePoints(M: number, p: number): number[][] {
    if (M === 0) {
      throw new Error(
        shouldNeverHappen("[referencePoints] The objective number is 0.")
      );
    }
    return this.referencePointsGenerator([], M, p, p, 0);
  }

  // Source: https://github.com/Valdecy/pyMultiobjective/blob/0c72fc293726d76352d51875374f2327aa6d122b/pyMultiobjective/algorithm/rvea.py
  /**
   *
   * @param referencePoints
   * @param M
   * @param Q
   * @param T
   * @param D
   */
  public referencePointsGenerator(
    referencePoints: number[],
    M: number,
    Q: number,
    T: number,
    D: number
  ): number[][] {
    const points: number[][] = [];
    if (D === M - 1) {
      referencePoints[D] = Q / T;
      points.push(referencePoints);
    } else if (D !== M - 1) {
      for (let index = 0; index <= Q; index++) {
        referencePoints[D] = index / T;
        points.push(
          ...this.referencePointsGenerator(
            [...referencePoints],
            M,
            Q - index,
            T,
            D + 1
          )
        );
      }
    }
    return points;
  }

  /**
   * Perform reference vector adaptation.
   *
   * Described in:
   * A Reference Vector Guided Evolutionary Algorithm for Many-Objective Optimization
   * R. Cheng; Y. Jin; M. Olhofer; B. Sendhoff
   *
   * @param weights_ an array of originally generated reference vectors
   *
   * return new weights (reference vectors) and nearest neighbours.
   */
  public adaptation(
    population: T[],
    objectiveFunctions: Set<ObjectiveFunction<T>>,
    /* population: number[][], weights: number[][], */ weights_: number[][] /*M: number*/
  ): { newWeights: number[][]; newNeighbours: number[] } {
    // Find z_min and z_max
    RVEA.LOGGER.debug("[adaptation] Start.");
    const zDifference: number[] = [];
    for (const objective of objectiveFunctions) {
      let zMin = population[0].getDistance(objective);
      let zMax = zMin;
      for (const individual of population) {
        const z = individual.getDistance(objective);
        if (z < zMin) {
          zMin = z;
        }
        if (z > zMax) {
          zMax = z;
        }
      }
      zDifference.push(zMax - zMin);
    }
    // Perform a calculation
    //TODO: Check that the order of objectives in weights matches the objectives from objectiveManager.
    let newWeights = weights_.map((weight) =>
      weight.map((number, index) => number * zDifference[index])
    );
    const norms = newWeights.map((weight) =>
      Math.sqrt(weight.reduce((x, y) => x + y ** 2, 0))
    );
    newWeights = newWeights.map((weight, index) =>
      weight.map((number) => number / norms[index])
    );
    // Compute nearest neighbors
    const newNeighbours = this.nearestNeighbors(newWeights);
    // return new weights and nearest neighbors
    RVEA.LOGGER.debug("[adaptation] End.");
    return { newWeights: newWeights, newNeighbours: newNeighbours };
  }
}
