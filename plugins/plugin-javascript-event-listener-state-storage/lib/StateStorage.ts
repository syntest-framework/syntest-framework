/*
 * Copyright 2020-2023 SynTest contributors
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
import * as path from "node:path";

import {
  DiscoveredObjectType,
  Element,
  Export,
  Relation,
  RootContext,
  TypeModel,
} from "@syntest/analysis-javascript";
import { StorageManager } from "@syntest/storage";

export class StateStorage {
  private storageManager: StorageManager;
  private storagePath: string;

  constructor(storageManager: StorageManager, storagePath: string) {
    this.storageManager = storageManager;
    this.storagePath = storagePath;
  }

  exportExtractionComplete(
    rootContext: RootContext,
    filepath: string,
    exports_: Export[]
  ): void {
    this.save(
      JSON.stringify(Object.fromEntries(exports_.entries()), undefined, 2),
      filepath,
      "exports.json"
    );
  }

  elementExtractionComplete(
    rootContext: RootContext,
    filepath: string,
    elements: Map<string, Element>
  ): void {
    this.save(
      JSON.stringify(Object.fromEntries(elements.entries()), undefined, 2),
      filepath,
      "elements.json"
    );
  }

  relationExtractionComplete(
    rootContext: RootContext,
    filepath: string,
    relations: Map<string, Relation>
  ): void {
    this.save(
      JSON.stringify(Object.fromEntries(relations.entries()), undefined, 2),
      filepath,
      "relations.json"
    );
  }

  objectTypeExtractionComplete(
    rootContext: RootContext,
    filepath: string,
    objects: Map<string, DiscoveredObjectType>
  ): void {
    this.save(
      JSON.stringify(Object.fromEntries(objects.entries()), undefined, 2),
      filepath,
      "objects.json"
    );
  }

  typeResolvingComplete(rootContext: RootContext): void {
    const typeModel = rootContext.getTypeModel();
    const graph = this.typeModelToGraphFormat(typeModel);
    const data = JSON.stringify(graph, undefined, 2);

    this.storageManager.store([this.storagePath], "typemodel.json", data);
  }

  save(
    data: string,
    filepath: string,
    type: "exports.json" | "elements.json" | "relations.json" | "objects.json"
  ) {
    const name = path.basename(filepath, path.extname(filepath));

    this.storageManager.store([this.storagePath, name], type, data);
  }

  private typeModelToGraphFormat(typeModel: TypeModel) {
    const graph: Graph = {
      nodes: [],
      edges: [],
    };

    for (const [id, typeNode] of typeModel.typeNodes.entries()) {
      const typeScores = typeNode.typeScores;
      const executionScores = typeNode.executionScores;
      const relationScores = typeNode.dependencyScores;

      const scores: Score[] = [];

      for (const [type, score] of typeScores.entries()) {
        scores.push({
          type: type,
          typeScore: score,
          executionScore:
            executionScores && executionScores.has(type)
              ? executionScores.get(type)
              : 0,
        });
      }

      graph.nodes.push({
        id: id,
        scores: scores,
      });

      for (const [id2, score] of relationScores) {
        graph.edges.push({
          source: id,
          target: id2.id,
          relationScore: score,
          relationExecutionScore: executionScores.get(id2.id) ?? 0,
        });
      }
    }

    return graph;
  }
}

type Score = {
  type: string;
  typeScore: number;
  executionScore: number;
};

type Node = {
  id: string;
  scores: Score[];
  // probabilities? no supported rn
};

type Edge = {
  source: string;
  target: string;
  relationScore: number;
  relationExecutionScore: number;
};

type Graph = {
  nodes: Node[];
  edges: Edge[];
};
