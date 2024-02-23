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
import { EdgeType } from "./EdgeType";

/**
 * Represents a jump between two basic blocks in a control flow graph.
 */
export class Edge {
  readonly id: string;
  readonly type: EdgeType;
  readonly label: string;
  readonly description?: string;

  readonly source: string;
  readonly target: string;

  constructor(
    id: string,
    type: EdgeType,
    label: string,
    source: string,
    target: string,
    description?: string,
  ) {
    this.id = id;
    this.type = type;
    this.label = label;
    this.source = source;
    this.target = target;
    this.description = description;
  }
}
