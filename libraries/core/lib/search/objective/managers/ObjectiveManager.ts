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

import { Encoding } from "../../Encoding";
import { ObjectiveFunction } from "../ObjectiveFunction";
import { Archive } from "../../Archive";
import { SearchSubject } from "../../SearchSubject";
import { EncodingRunner } from "../../EncodingRunner";
import { ExceptionObjectiveFunction } from "../ExceptionObjectiveFunction";
import * as crypto from "crypto";
import { BudgetManager } from "../../budget/BudgetManager";
import { TerminationManager } from "../../termination/TerminationManager";
import { SecondaryObjectiveComparator } from "../secondary/SecondaryObjectiveComparator";

/**
 * Manager that keeps track of which objectives have been covered and are still to be searched.
 *
 * @author Mitchell Olsthoorn
 */
export abstract class ObjectiveManager<T extends Encoding> {
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
  protected _secondaryObjectives: Set<SecondaryObjectiveComparator<T>>;

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
    secondaryObjectives: Set<SecondaryObjectiveComparator<T>>
  ) {
    this._archive = new Archive<T>();
    this._currentObjectives = new Set<ObjectiveFunction<T>>();
    this._coveredObjectives = new Set<ObjectiveFunction<T>>();
    this._uncoveredObjectives = new Set<ObjectiveFunction<T>>();
    this._runner = runner;
    this._secondaryObjectives = secondaryObjectives;
  }

  /**
   * Update the objectives.
   *
   * @param objectiveFunction
   * @param encoding
   * @param distance
   * @protected
   */
  protected abstract _updateObjectives(
    objectiveFunction: ObjectiveFunction<T>
  ): void;

  /**
   * Update the archive.
   *
   * @param objectiveFunction
   * @param encoding
   * @protected
   */
  protected _updateArchive(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T
  ) {
    if (!this._archive.has(objectiveFunction)) {
      this._archive.update(objectiveFunction, encoding);
    } else {
      // If the objective is already in the archive we use secondary objectives
      const currentEncoding = this._archive.getEncoding(objectiveFunction);

      // Look at secondary objectives when two solutions are found
      for (const secondaryObjective of this._secondaryObjectives) {
        const comparison = secondaryObjective.compare(
          encoding,
          currentEncoding
        );

        // If one of the two encodings is better, don't evaluate the next objectives
        if (comparison != 0) {
          // Override the encoding if the current one is better
          if (comparison > 0) {
            this._archive.update(objectiveFunction, encoding);
          }
          break;
        }
      }
    }
  }

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
    terminationManager: TerminationManager
  ): Promise<void> {
    for (const encoding of encodings) {
      // If there is no budget left or a termination trigger has been triggered, stop evaluating
      if (!budgetManager.hasBudgetLeft() || terminationManager.isTriggered())
        break;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    terminationManager: TerminationManager
  ): Promise<void> {
    // Execute the encoding
    const result = await this._runner.execute(this._subject, encoding);
    budgetManager.evaluation(encoding);

    // Store the execution result in the encoding
    encoding.setExecutionResult(result);

    // For all current objectives
    this._currentObjectives.forEach((objectiveFunction) => {
      // Calculate and store the distance
      const distance = objectiveFunction.calculateDistance(encoding);
      encoding.setDistance(objectiveFunction, distance);

      // When the objective is covered, update the objectives and the archive
      if (distance === 0.0) {
        // Update the objectives
        this._updateObjectives(objectiveFunction);

        // Update the archive
        this._updateArchive(objectiveFunction, encoding);
      }
    });

    // Create separate exception objective when an exception occurred in the execution
    if (result.hasExceptions()) {
      // TODO there must be a better way
      //  investigate error patterns somehow

      const hash = crypto
        .createHash("md5")
        .update(result.getExceptions())
        .digest("hex");

      const numOfExceptions = this._archive
        .getObjectives()
        .filter((objective) => objective instanceof ExceptionObjectiveFunction)
        .filter((objective) => objective.getIdentifier() === hash).length;
      if (numOfExceptions === 0) {
        // TODO this makes the archive become too large crashing the tool
        this._archive.update(
          new ExceptionObjectiveFunction(
            this._subject,
            hash,
            result.getExceptions()
          ),
          encoding
        );
      }
    }
  }

  /**
   * Load the objectives from the search subject into the manager.
   *
   * @param subject The subject to load in
   */
  public abstract load(subject: SearchSubject<T>): void;

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
