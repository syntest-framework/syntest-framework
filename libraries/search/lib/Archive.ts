/*
 * Copyright 2020-2021 SynTest contributors
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

import { Encoding } from "./Encoding";
import { ObjectiveFunction } from "./objective/ObjectiveFunction";
import { shouldNeverHappen } from "./util/diagnostics";

/**
 * Archive that keeps track of the fittest encodings for each covered objective.
 *
 * @author Mitchell Olsthoorn
 */
export class Archive<T extends Encoding> {
  protected static LOGGER: Logger;

  /**
   * Mapping of covered objectives to the corresponding fittest encoding.
   *
   * @protected
   */
  protected _map: Map<ObjectiveFunction<T>, T>;

  /**
   * Mapping of unique encodings contained within the archive to the objectives
   * that they were selected for.
   *
   * @protected
   */
  protected _uses: Map<T, ObjectiveFunction<T>[]>;

  constructor() {
    Archive.LOGGER = getLogger("Archive");
    this._map = new Map<ObjectiveFunction<T>, T>();
    this._uses = new Map<T, ObjectiveFunction<T>[]>();
  }

  /**
   * The size of the archive.
   *
   * Measured by the number of unique encodings contained in the archive.
   */
  get size(): number {
    return this._uses.size;
  }

  /**
   * Determines if the archive already contains this objective function.
   *
   * @param objectiveFunction The objective function to check for
   */
  hasObjective(objectiveFunction: ObjectiveFunction<T>): boolean {
    return this._map.has(objectiveFunction);
  }

  /**
   * Determines if the archive already contains this encoding.
   *
   * @param encoding The encoding to check for
   */
  hasEncoding(encoding: T): boolean {
    return this._uses.has(encoding);
  }

  /**
   * Updates the archive with a new encoding.
   *
   * This function will overwrite the current encoding for the specified objective function.
   *
   * @param objectiveFunction The objective to update
   * @param encoding The new encoding
   * @param keepOld Whether to keep the old encoding in the archive
   */
  update(
    objectiveFunction: ObjectiveFunction<T>,
    encoding: T,
    keepOld: boolean
  ): void {
    const oldEncoding = this._map.get(objectiveFunction);

    // Remove the old encoding from the uses map
    if (oldEncoding && oldEncoding !== encoding) {
      const uses = this._uses.get(oldEncoding);
      uses.splice(uses.indexOf(objectiveFunction), 1);
      if (uses.length === 0 && !keepOld) {
        this._uses.delete(oldEncoding);
      }
    }

    // Do not update if the encoding is already assigned to the objective function
    if (oldEncoding && oldEncoding === encoding) {
      Archive.LOGGER.debug("encoding already assigned to objective function");
      throw new Error(
        shouldNeverHappen("encoding already assigned to objective function")
      );
    }

    // Add the encoding to the archive
    this._map.set(objectiveFunction, encoding);

    // Add the encoding to the uses map
    if (!this._uses.has(encoding)) {
      this._uses.set(encoding, []);
    }

    this._uses.get(encoding).push(objectiveFunction);
  }

  /**
   * Merges the given archive into this archive.
   *
   * When there is overlap in the archives the current one will be overriden.
   * WARNING: this function does thus not use the secondary objectives to select the optimal solution.
   * TODO use the secondary objectives in this function
   *
   * @param other the other archive
   */
  merge(other: Archive<T>): void {
    for (const key of other.getObjectives()) {
      this.update(key, other.getEncoding(key), true);
    }
  }

  /**
   * Clears the archive.
   */
  clear(): void {
    this._map.clear();
    this._uses.clear();
  }

  /**
   * Return the objective functions associated with the stored encodings.
   */
  getObjectives(): ObjectiveFunction<T>[] {
    return [...this._map.keys()];
  }

  /**
   * Return the encodings.
   */
  getEncodings(): T[] {
    return [...this._uses.keys()];
  }

  /**
   * Return the encoding corresponding with the objective function.
   *
   * @param objective The objective to use.
   */
  getEncoding(objective: ObjectiveFunction<T>): T {
    return this._map.get(objective);
  }

  /**
   * Return the uses of the encoding across the objective functions.
   *
   * @param encoding The encoding to look for.
   */
  getUses(encoding: T): ObjectiveFunction<T>[] {
    return this._uses.get(encoding);
  }
}
