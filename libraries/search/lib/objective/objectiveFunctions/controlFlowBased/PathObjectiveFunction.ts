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
import { getLogger, Logger } from "@syntest/logging";

import { Encoding } from "../../../Encoding";
import { ExecutionResult } from "../../../ExecutionResult";

import { ControlFlowBasedObjectiveFunction } from "./ControlFlowBasedObjectiveFunction";

export class PathObjectiveFunction<
  T extends Encoding
> extends ControlFlowBasedObjectiveFunction<T> {
  protected static LOGGER: Logger;
  protected controlFlowPath: ControlFlowPath;

  constructor(
    id: string,
    controlFlowProgram: ControlFlowProgram,
    controlFlowPath: ControlFlowPath
  ) {
    super(id, controlFlowProgram);
    PathObjectiveFunction.LOGGER = getLogger(PathObjectiveFunction.name);
    this.controlFlowPath = controlFlowPath;
  }

  override calculateDistance(encoding: T): number {
    const executionResult = encoding.getExecutionResult();

    if (
      executionResult === undefined ||
      executionResult.getTraces().length === 0
    ) {
      return Number.MAX_VALUE;
    }

    return this.shallow
      ? Number.MAX_VALUE
      : this._calculateControlFlowDistance(executionResult);
  }

  protected override _calculateControlFlowDistance(
    executionResult: ExecutionResult
  ): number {
    let distance = 0;

    for (const nodeId of this.controlFlowPath.path) {
      if (
        nodeId === "ENTRY" ||
        nodeId === "ERROR_EXIT" ||
        nodeId === "SUCCESS_EXIT"
      ) {
        continue;
      }

      if (!this.controlFlowPath.isControlNode(nodeId)) {
        // only check control nodes
        continue;
      }

      if (!executionResult.coversId(nodeId)) {
        distance += 1;
      }
    }

    return distance;
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
    return this._path[this._path.length - 1];
  }

  get path() {
    return this._path;
  }
}
