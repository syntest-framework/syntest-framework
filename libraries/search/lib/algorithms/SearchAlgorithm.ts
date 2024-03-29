/*
 * Copyright 2020-2021 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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
import TypedEmitter from "typed-emitter";

import { Archive } from "../Archive";
import { BudgetManager } from "../budget/BudgetManager";
import { Encoding } from "../Encoding";
import { Events } from "../Events";
import { ObjectiveManager } from "../objective/managers/ObjectiveManager";
import { ObjectiveFunction } from "../objective/ObjectiveFunction";
import { SearchSubject } from "../SearchSubject";
import { TerminationManager } from "../termination/TerminationManager";

/**
 * Abstract search algorithm to search for an optimal solution within the search space.
 *
 * The search algorithm is dependent on the encoding of the search space.
 */
export abstract class SearchAlgorithm<T extends Encoding> {
  protected static LOGGER: Logger;

  /**
   * The population.
   *
   * @protected
   */
  protected _population: T[];

  /**
   * Manager that keeps track of which objectives have been covered and are still to be searched.
   * @protected
   */
  protected _objectiveManager: ObjectiveManager<T>;

  /**
   * Abstract constructor.
   *
   * @param eventManager The event manager
   * @param objectiveManager The objective manager
   * @protected
   */
  protected constructor(objectiveManager: ObjectiveManager<T>) {
    SearchAlgorithm.LOGGER = getLogger(SearchAlgorithm.name);
    this._population = [];
    this._objectiveManager = objectiveManager;
  }

  /**
   * Initialization phase of the search process.
   *
   * @protected
   * @param budgetManager The budget manager to track budget progress
   * @param terminationManager The termination trigger manager
   */
  protected abstract _initialize(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager,
  ): Promise<void> | void;

  /**
   * Iteration phase of the search process.
   *
   * @protected
   * @param budgetManager The budget manager to track budget progress
   * @param terminationManager The termination trigger manager
   */
  protected abstract _iterate(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager,
  ): Promise<void>;

  /**
   * Search the search space for an optimal solution until one of the termination conditions are met.
   *
   * @param subject The subject of the search
   * @param budgetManager The budget manager to track budget progress
   * @param terminationManager The termination trigger manager
   */
  public async search(
    subject: SearchSubject<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager,
  ): Promise<Archive<T>> {
    SearchAlgorithm.LOGGER.info("Starting search");

    // Load search subject into the objective manager
    this._objectiveManager.load(subject);

    // Start initialization budget tracking
    budgetManager.initializationStarted();

    (<TypedEmitter<Events>>process).emit(
      "searchInitializationStart",
      this,
      subject,
      budgetManager,
      terminationManager,
    );

    // Initialize search process
    await this._initialize(budgetManager, terminationManager);

    // Stop initialization budget tracking, inform the listeners, and start search budget tracking
    budgetManager.initializationStopped();

    (<TypedEmitter<Events>>process).emit(
      "searchInitializationComplete",
      this,
      subject,
      budgetManager,
      terminationManager,
    );

    budgetManager.searchStarted();

    (<TypedEmitter<Events>>process).emit(
      "searchStart",
      this,
      subject,
      budgetManager,
      terminationManager,
    );

    // Start search until the budget has expired, a termination trigger has been triggered, or there are no more objectives
    while (
      this._objectiveManager.hasObjectives() &&
      budgetManager.hasBudgetLeft() &&
      !terminationManager.isTriggered()
    ) {
      (<TypedEmitter<Events>>process).emit(
        "searchIterationStart",
        this,
        subject,
        budgetManager,
        terminationManager,
      );

      // Start next iteration of the search process
      await this._iterate(budgetManager, terminationManager);

      // Inform the budget manager and listeners that an iteration happened
      budgetManager.iteration(this);

      (<TypedEmitter<Events>>process).emit(
        "searchIterationComplete",
        this,
        subject,
        budgetManager,
        terminationManager,
      );
    }

    // Stop search budget tracking
    budgetManager.searchStopped();

    (<TypedEmitter<Events>>process).emit(
      "searchComplete",
      this,
      subject,
      budgetManager,
      terminationManager,
    );

    // Finalize the population
    this._objectiveManager.finalize(this._population);

    // Return the archive of covered objectives
    return this._objectiveManager.getArchive();
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public calculateObjectivePerformance(
    objectives: ObjectiveFunction<T>[],
  ): Map<ObjectiveFunction<T>, number> {
    const objectivePerformace = new Map<ObjectiveFunction<T>, number>();

    for (const encoding of this._population) {
      if (encoding.getExecutionResult() === undefined) {
        continue;
      }

      for (const objective of objectives) {
        const distance = encoding.getDistance(objective);
        if (distance === undefined) {
          continue;
        }

        if (objectivePerformace.has(objective)) {
          const smallestDistance = objectivePerformace.get(objective);
          if (distance < smallestDistance) {
            objectivePerformace.set(objective, distance);
          }
        } else {
          objectivePerformace.set(objective, distance);
        }
      }
    }
    return objectivePerformace;
  }

  /**
   * Return the objective manager.
   */
  public getObjectiveManager(): ObjectiveManager<T> {
    return this._objectiveManager;
  }

  /**
   * The progress of the search process.
   */
  public progress(): number {
    const covered = this._objectiveManager.getCoveredObjectives();
    const uncovered = this._objectiveManager.getUncoveredObjectives();

    const progress = (covered.size / (covered.size + uncovered.size)) * 100;
    const factor = 10 ** 2;
    return Math.round(progress * factor) / factor;
  }
}
