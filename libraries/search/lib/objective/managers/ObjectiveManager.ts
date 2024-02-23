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

import { ImplementationError } from "@syntest/diagnostics";
import { getLogger, Logger } from "@syntest/logging";

import { Archive } from "../../Archive";
import { BudgetManager } from "../../budget/BudgetManager";
import { Encoding } from "../../Encoding";
import { EncodingRunner } from "../../EncodingRunner";
import { SearchSubject } from "../../SearchSubject";
import { TerminationManager } from "../../termination/TerminationManager";
import { ExceptionObjectiveFunction } from "../exception/ExceptionObjectiveFunction";
import { ObjectiveFunction } from "../ObjectiveFunction";
import { SecondaryObjectiveComparator } from "../secondary/SecondaryObjectiveComparator";

/**
 * Manager that keeps track of which objectives have been covered and are still to be searched.
 */
export abstract class ObjectiveManager<T extends Encoding> {
  protected static LOGGER: Logger;

  /**
   * Archive of covered objectives with the fittest encoding for that objective.
   * @protected
   */
  protected _archive: Archive<T>;

  /**
   * Set of current objectives.
   * @protected
   */
  protected _currentObjectives: Set<ObjectiveFunction<T>>;

  /**
   * Set of covered objectives.
   * @protected
   */
  protected _coveredObjectives: Set<ObjectiveFunction<T>>;

  /**
   * Set of uncovered objectives.
   * @protected
   */
  protected _uncoveredObjectives: Set<ObjectiveFunction<T>>;

  /**
   * Runner for executing encodings.
   * @protected
   */
  protected _runner: EncodingRunner<T>;

  /**
   * List of secondary objectives.
   * @protected
   */
  protected _secondaryObjectives: SecondaryObjectiveComparator<T>[];

  protected _exceptionObjectivesEnabled: boolean;

  /**
   * The subject of the search.
   * @protected
   */
  protected _subject: SearchSubject<T>;

  /**
   * Constructor.
   *
   * @param runner Encoding runner
   * @param secondaryObjectives Secondary objectives to use
   */
  constructor(
    runner: EncodingRunner<T>,
    secondaryObjectives: SecondaryObjectiveComparator<T>[],
    exceptionObjectivesEnabled: boolean,
  ) {
    ObjectiveManager.LOGGER = getLogger("ObjectiveManager");
    this._runner = runner;
    this._secondaryObjectives = secondaryObjectives;
    this._exceptionObjectivesEnabled = exceptionObjectivesEnabled;
    this._archive = new Archive<T>();
    this._currentObjectives = new Set<ObjectiveFunction<T>>();
    this._coveredObjectives = new Set<ObjectiveFunction<T>>();
    this._uncoveredObjectives = new Set<ObjectiveFunction<T>>();
  }

  /**
   * Logic for handling covered objectives.
   *
   * @param objectiveFunction
   * @param encoding
   */
  protected abstract _handleCoveredObjective(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T,
  ): ObjectiveFunction<T>[];

  /**
   * Logic for handling uncovered objectives.
   *
   * @param objectiveFunction
   * @param encoding
   * @param distance
   */
  protected abstract _handleUncoveredObjective(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T,
    distance: number,
  ): void;

  /**
   * Update the objectives.
   *
   * @param objectiveFunction
   * @param encoding
   * @param distance
   * @protected
   */
  protected abstract _updateObjectives(
    objectiveFunction: ObjectiveFunction<T>,
  ): ObjectiveFunction<T>[];

  /**
   * Evaluate multiple encodings on the current objectives.
   *
   * @param encodings The encoding to evaluate
   * @param budgetManager The budget manager to track the remaining budget
   * @param terminationManager The termination trigger manager
   */
  public async evaluateMany(
    encodings: T[],
    budgetManager: BudgetManager<T>,
    terminationManager: TerminationManager,
  ): Promise<void> {
    for (const encoding of encodings) {
      // If there is no budget left or a termination trigger has been triggered, stop evaluating
      if (!budgetManager.hasBudgetLeft() || terminationManager.isTriggered()) {
        break;
      }

      await this.evaluateOne(encoding, budgetManager, terminationManager);
    }
  }

  /**
   * Evaluate one encoding on the current objectives.
   *
   * @param encoding The encoding to evaluate
   * @param budgetManager The budget manager to track evaluation
   * @param terminationManager The termination trigger manager
   */
  public async evaluateOne(
    encoding: T,
    budgetManager: BudgetManager<T>,
    _terminationManager: TerminationManager,
  ): Promise<void> {
    ObjectiveManager.LOGGER.debug(`Evaluating encoding ${encoding.id}`);
    // Execute the encoding
    const result = await this._runner.execute(encoding);

    // TODO: Use events for this so we can elimate the dependency on the budget manager
    budgetManager.evaluation();

    // Store the execution result in the encoding
    encoding.setExecutionResult(result);

    // For all current objectives
    for (const objectiveFunction of this._currentObjectives) {
      this.evaluateObjective(encoding, objectiveFunction);
    }

    // Create separate exception objective when an exception occurred in the execution
    if (this._exceptionObjectivesEnabled && result.hasError()) {
      const hash = result.getErrorIdentifier();

      const numberOfExceptions = this._archive
        .getObjectives()
        .filter((objective) => objective instanceof ExceptionObjectiveFunction)
        .filter((objective) => objective.getIdentifier() === hash).length;
      if (numberOfExceptions === 0) {
        this._archive.update(
          new ExceptionObjectiveFunction(hash, result.getError()),
          encoding,
          false,
        );
      }
    }
  }

  protected evaluateObjective(
    encoding: T,
    objectiveFunction: ObjectiveFunction<T>,
  ) {
    // Calculate and store the distance
    const distance = objectiveFunction.calculateDistance(encoding);
    if (Number.isNaN(distance)) {
      throw new ImplementationError(
        "Objective function distance calculation returned a NaN value",
      );
    }
    encoding.setDistance(objectiveFunction, distance);
    objectiveFunction.updateDistance(distance);

    // When the objective is covered, update the objectives and the archive
    if (distance === 0) {
      ObjectiveManager.LOGGER.debug(
        `Objective ${objectiveFunction.getIdentifier()} covered by encoding ${
          encoding.id
        }`,
      );

      const newObjectives = this._handleCoveredObjective(
        objectiveFunction,
        encoding,
      );

      for (const objective of newObjectives) {
        this.evaluateObjective(encoding, objective);
      }
    } else {
      ObjectiveManager.LOGGER.debug(
        `Distance from objective ${objectiveFunction.getIdentifier()} is ${distance} for encoding ${
          encoding.id
        }`,
      );

      this._handleUncoveredObjective(objectiveFunction, encoding, distance);
    }
  }

  /**
   * Load the objectives from the search subject into the manager.
   *
   * @param subject The subject to load in
   */
  public abstract load(subject: SearchSubject<T>): void;

  /**
   * Finalize the objectives before retrieving the archive.
   */
  public abstract finalize(_finalPopulation: T[]): void;

  /**
   * Reset the objectives.
   *
   * This function is used to reset the objectives when the search subject changes.
   *
   * TODO: Should the archive be reset as well?
   */
  protected _reset(): void {
    this._archive.clear();
    this._currentObjectives.clear();
    this._coveredObjectives.clear();
    this._uncoveredObjectives.clear();
  }

  /**
   * Return the uncovered objectives.
   */
  public getUncoveredObjectives(): Set<ObjectiveFunction<T>> {
    return this._uncoveredObjectives;
  }

  /**
   * Return the current objectives.
   */
  public getCurrentObjectives(): Set<ObjectiveFunction<T>> {
    return this._currentObjectives;
  }

  /**
   * Return the covered objectives.
   */
  public getCoveredObjectives(): Set<ObjectiveFunction<T>> {
    return this._coveredObjectives;
  }

  /**
   * Return the archive.
   */
  public getArchive(): Archive<T> {
    return this._archive;
  }

  /**
   * Determines if there are objectives left to cover.
   */
  public hasObjectives(): boolean {
    return this._currentObjectives.size > 0;
  }
}
