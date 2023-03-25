/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import { getLogger } from "@syntest/logging";
import TypedEmitter from "typed-emitter";

import { Events } from "../../util/Events";
import { Archive } from "../Archive";
import { BudgetManager } from "../budget/BudgetManager";
import { Encoding } from "../Encoding";
import { ExecutionResult } from "../ExecutionResult";
import { ObjectiveManager } from "../objective/managers/ObjectiveManager";
import { SearchSubject } from "../SearchSubject";
import { TerminationManager } from "../termination/TerminationManager";

/**
 * Abstract search algorithm to search for an optimal solution within the search space.
 *
 * The search algorithm is dependent on the encoding of the search space.
 *
 * @author Mitchell Olsthoorn
 */
export abstract class SearchAlgorithm<T extends Encoding> {
  static LOGGER = getLogger("SearchAlgorithm");

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
    terminationManager: TerminationManager
  ): void;

  /**
   * Iteration phase of the search process.
   *
   * @protected
   * @param budgetManager The budget manager to track budget progress
   * @param terminationManager The termination trigger manager
   */
  protected abstract _iterate(
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): void;

  /**
   * Search the search space for an optimal solution until one of the termination conditions are met.
   *
   * @param subject The subject of the search
   * @param budgetManager The budget manager to track budget progress
   * @param terminationManager The termination trigger manager
   */
  public search(
    subject: SearchSubject<T>,
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager
  ): Archive<T> {
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
      terminationManager
    );

    // Initialize search process
    this._initialize(budgetManager, terminationManager);

    // Stop initialization budget tracking, inform the listeners, and start search budget tracking
    budgetManager.initializationStopped();

    (<TypedEmitter<Events>>process).emit(
      "searchInitializationComplete",
      this,
      subject,
      budgetManager,
      terminationManager
    );

    budgetManager.searchStarted();

    (<TypedEmitter<Events>>process).emit(
      "searchStart",
      this,
      subject,
      budgetManager,
      terminationManager
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
        terminationManager
      );

      // Start next iteration of the search process
      this._iterate(budgetManager, terminationManager);

      // Inform the budget manager and listeners that an iteration happened
      budgetManager.iteration(this);

      (<TypedEmitter<Events>>process).emit(
        "searchIterationComplete",
        this,
        subject,
        budgetManager,
        terminationManager
      );
    }

    // Stop search budget tracking
    budgetManager.searchStopped();

    (<TypedEmitter<Events>>process).emit(
      "searchComplete",
      this,
      subject,
      budgetManager,
      terminationManager
    );

    // Return the archive of covered objectives
    return this._objectiveManager.getArchive();
  }

  /**
   * Return the objective manager.
   */
  public getObjectiveManager(): ObjectiveManager<T> {
    return this._objectiveManager;
  }

  public getCovered(objectiveType = "mixed"): number {
    const covered = new Set();

    for (const key of this._objectiveManager.getArchive().getObjectives()) {
      const test = this._objectiveManager.getArchive().getEncoding(key);
      const result: ExecutionResult = test.getExecutionResult();

      // TODO this does not work when there are files with the same name in different directories!!
      const paths = key.getSubject().path.split("/");
      const fileName = paths[paths.length - 1];

      for (const current of result
        .getTraces()
        .filter(
          (element) =>
            element.type.includes(objectiveType) || objectiveType === "mixed"
        )
        .filter((element) => element.path.includes(fileName))) {
        if (current.hits > 0) covered.add(current.id);
      }
    }
    return covered.size;
  }

  public getUncovered(objectiveType = "mixed"): number {
    const total = new Set();
    const covered = new Set();

    for (const key of this._objectiveManager.getArchive().getObjectives()) {
      const test = this._objectiveManager.getArchive().getEncoding(key);
      const result: ExecutionResult = test.getExecutionResult();

      // TODO this does not work when there are files with the same name in different directories!!
      const paths = key.getSubject().path.split("/");
      const fileName = paths[paths.length - 1];

      for (const current of result
        .getTraces()
        .filter(
          (element) =>
            element.type.includes(objectiveType) || objectiveType === "mixed"
        )
        .filter((element) => element.path.includes(fileName))) {
        total.add(current.id);

        if (current.hits > 0) covered.add(current.id);
      }
    }
    return total.size - covered.size;
  }

  /**
   * The progress of the search process.
   */
  public progress(objectiveType = "mixed"): number {
    const numberOfCoveredObjectives = this.getCovered(objectiveType);
    const numberOfUncoveredObjectives = this.getUncovered(objectiveType);
    const progress =
      (numberOfCoveredObjectives /
        (numberOfCoveredObjectives + numberOfUncoveredObjectives)) *
      100;
    const factor = 10 ** 2;
    return Math.round(progress * factor) / factor;
  }
}
