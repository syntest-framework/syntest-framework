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
import { NodeType } from "./NodeType";

/**
 * Represents a basic block in a control flow graph.
 */
export class Node {
  readonly id: string;
  readonly type: NodeType;
  readonly label: string;
  readonly description?: string;

  /**
   * The ordered list of statements in this node.
   */
  readonly statements: Statement[];
  readonly metadata: MetaData;

  constructor(
    id: string,
    type: NodeType,
    label: string,
    statements: Statement[],
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
}

export type MetaData = {
  readonly [key: string]: unknown;
};

export interface Location {
  readonly start: {
    readonly line: number;
    readonly column: number;
    readonly index: number;
  };
  readonly end: {
    readonly line: number;
    readonly column: number;
    readonly index: number;
  };
}
export interface Statement {
  readonly id: string;
  readonly location: Location;
  readonly statementAsText: string;
}
