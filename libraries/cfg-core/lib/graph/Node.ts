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
import { Edge } from "./Edge";
import { NodeType } from "./NodeType";

/**
 * Represents a basic block in a control flow graph.
 */
export class Node<S> {
  readonly id: string;
  readonly type: NodeType;
  readonly label: string;
  readonly description?: string;

  /**
   * The ordered list of statements in this node.
   */
  readonly statements: S[];
  readonly metadata: MetaData;

  constructor(
    id: string,
    type: NodeType,
    label: string,
    statements: S[],
    metadata: MetaData,
    description?: string
  ) {
    this.id = id;
    this.type = type;
    this.label = label;
    this.statements = statements;
    this.metadata = metadata;
    this.description = description;
  }

  makeImmutable(): void {
    Object.freeze(this);
    Object.freeze(this.statements);
    Object.freeze(this.metadata);
  }
}

export type MetaData = {
  readonly [key: string]: unknown;
  readonly lineNumbers: number[];
};
