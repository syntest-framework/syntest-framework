/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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

export class ControlFlowPath {
  protected controlNodeTable: Map<string, boolean>;
  protected path: string[];
  protected pathSet: Set<string>;

  constructor(controlNodeTable?: Map<string, boolean>, path?: string[]) {
    this.controlNodeTable = controlNodeTable;
    this.path = path;

    if (!this.controlNodeTable) {
      this.controlNodeTable = new Map();
    }
    if (!this.path) {
      this.path = [];
    }

    this.pathSet = new Set(this.path);
  }

  addNodeToPath(id: string) {
    this.path.push(id);
    this.pathSet.add(id);
  }

  setControlNode(id: string, value: boolean) {
    this.controlNodeTable.set(id, value);
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
    return new ControlFlowPath(new Map(this.controlNodeTable), [...this.path]);
  }

  get first() {
    return this.path[0];
  }

  get last() {
    return this.path[this.path.length - 1];
  }
}
