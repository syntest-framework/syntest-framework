/*
 * Copyright 2020-2023 SynTest contributors
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

import { ControlFlowProgram } from "@syntest/cfg";
import { ImplementationError } from "@syntest/diagnostics";
import { getLogger, Logger } from "@syntest/logging";

import { Encoding } from "../../Encoding";
import { BranchObjectiveFunction } from "../branch/BranchObjectiveFunction";
import { ApproachLevelCalculator } from "../heuristics/ApproachLevelCalculator";
import { BranchDistanceCalculator } from "../heuristics/BranchDistanceCalculator";

export class PathObjectiveFunction<
  T extends Encoding,
> extends BranchObjectiveFunction<T> {
  protected static override LOGGER: Logger;
  protected _controlFlowPath: ControlFlowPath;

  constructor(
    id: string,
    controlFlowProgram: ControlFlowProgram,
    controlFlowPath: ControlFlowPath,
    approachLevelCalculator: ApproachLevelCalculator,
    branchDistanceCalculator: BranchDistanceCalculator,
  ) {
    super(
      id,
      controlFlowProgram,
      approachLevelCalculator,
      branchDistanceCalculator,
    );
    PathObjectiveFunction.LOGGER = getLogger(PathObjectiveFunction.name);
    this._controlFlowPath = controlFlowPath;
    this.branchDistanceCalculator = branchDistanceCalculator;
  }

  override calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();

    if (
      executionResult === undefined ||
      executionResult.getTraces().length === 0
    ) {
      return Number.MAX_VALUE;
    }

    if (this.shallow) {
      return Number.MAX_VALUE;
    }

    for (const [index, nodeId] of this._controlFlowPath.path.entries()) {
      if (
        nodeId === "ENTRY" ||
        nodeId === "ERROR_EXIT" ||
        nodeId === "SUCCESS_EXIT"
      ) {
        continue;
      }

      if (!executionResult.coversId(nodeId)) {
        if (index === 1) {
          // first node (excluding ENTRY) in function is not covered so the entire path is untouched
          return Number.MAX_VALUE;
        }

        const totalDistance = this._calculateControlFlowDistance(
          nodeId,
          executionResult,
        );

        if (totalDistance > 1) {
          // TODO this can bassically not happen unless there is an implementation error (should we keep it?)
          throw new ImplementationError(
            "Total distance should be less than 1 as the previous node in the path was covered",
            { context: { actualDistance: totalDistance } },
          );
        }

        // distance is equal to the "branch distance" + the number of nodes after this node that we still need to cover
        return this._controlFlowPath.path.length - index + totalDistance;
      }
    }

    // all are covered
    return 0;
  }

  get controlFlowPath() {
    return this._controlFlowPath;
  }
}

export class ControlFlowPath {
  protected controlNodeTable: Map<string, boolean>;
  protected _path: string[];
  protected pathSet: Set<string>;

  constructor(controlNodeTable?: Map<string, boolean>, path?: string[]) {
    this.controlNodeTable = controlNodeTable;
    this._path = path;

    if (!this.controlNodeTable) {
      this.controlNodeTable = new Map();
    }
    if (!this._path) {
      this._path = [];
    }

    this.pathSet = new Set(this._path);
  }

  addNodeToPath(id: string) {
    this._path.push(id);
    this.pathSet.add(id);
  }

  setControlNode(id: string, value: boolean) {
    this.controlNodeTable.set(id, value);
  }

  isControlNode(id: string) {
    return this.controlNodeTable.has(id);
  }

  getControlNodeValue(id: string) {
    return this.controlNodeTable.get(id);
  }

  contains(id: string) {
    return this.pathSet.has(id);
  }

  match(path: string[]) {
    const pathSet = new Set(path);

    if (pathSet.size !== this.pathSet.size) {
      return false;
    }

    for (const value of this.pathSet) {
      if (!pathSet.has(value)) {
        return false;
      }
    }

    return true;
  }

  clone(): ControlFlowPath {
    return new ControlFlowPath(new Map(this.controlNodeTable), [...this._path]);
  }

  get first() {
    return this._path[0];
  }

  get last() {
    return this._path.at(-1);
  }

  get path() {
    return this._path;
  }
}
