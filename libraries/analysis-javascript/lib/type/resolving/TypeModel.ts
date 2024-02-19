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

import { prng } from "@syntest/prng";

import { ObjectType } from "./Type";
import { TypeEnum } from "./TypeEnum";
import { TypeNode } from "./TypeNode";

export class TypeModel {
  protected _typeNodes: Map<string, TypeNode>;

  get typeNodes() {
    return this._typeNodes;
  }

  constructor() {
    this._typeNodes = new Map();

    this.createTypeNode("anon"); // should be removed at some point
  }

  public createTypeNode(id: string) {
    if (this._typeNodes.has(id)) {
      return;
    }
    this._typeNodes.set(id, new TypeNode(id));
  }

  public getTypeNode(id: string) {
    if (!this._typeNodes.has(id)) {
      throw new Error(`Element ${id} does not exist in type model`);
    }
    return this._typeNodes.get(id);
  }

  getObjectDescription(element: string): ObjectType {
    return this.getTypeNode(element).objectType;
  }

  setEqual(id1: string, id2: string) {
    const node1 = this.getTypeNode(id1);
    const node2 = this.getTypeNode(id2);

    node1.merge(node2);
  }

  addWeakRelation(id1: string, id2: string) {
    this.addRelationScore(id1, id2, 1);
  }

  addStrongRelation(id1: string, id2: string) {
    this.addRelationScore(id1, id2, 3);
  }

  addRelationScore(id1: string, id2: string, score: number) {
    if (id1 === id2) {
      // no self loops
      return;
      // throw new ImplementationError(`ids should not be equal to add a relation id: ${id1}`);
    }
    const node1 = this.getTypeNode(id1);
    const node2 = this.getTypeNode(id2);
    node1.addDependencyScore(node2, score);
    node2.addDependencyScore(node1, score);
  }

  addStrongTypeScore(id: string, type: TypeEnum) {
    this.addTypeScore(id, type, 5);
  }

  addTypeScore(id: string, type: TypeEnum, score = 1) {
    this.getTypeNode(id).addTypeScore(type, score);
  }

  addPropertyType(element: string, property: string, id: string) {
    this.getTypeNode(element).addPropertyType(property, id);
  }

  addParameterType(element: string, index: number, id: string, name: string) {
    this.getTypeNode(element).addParameterType(index, id, name);
  }

  addReturnType(element: string, returnId: string) {
    this.getTypeNode(element).addReturnType(returnId);
  }

  addElementType(element: string, id: string) {
    this.getTypeNode(element).addElementType(id);
  }

  addExecutionScore(
    id: string,
    typeId: string,
    typeEnum: TypeEnum,
    score = -1
  ) {
    this.getTypeNode(id).addExecutionScore(typeId, typeEnum, score);
  }

  private _sum(iterable: Iterable<number>) {
    return [...iterable].reduce(
      (total, currentValue) => total + currentValue,
      0
    );
  }

  /**
   * Gets a random type
   * @param id the id we want to get a random type for
   * @returns a string describing the type
   */
  getRandomType(id: string) {
    const probabilities = this.getTypeNode(id).getTypeProbabilities();

    const genericTypes = [
      TypeEnum.ARRAY,
      TypeEnum.BOOLEAN,
      TypeEnum.FUNCTION,
      TypeEnum.NULL,
      TypeEnum.NUMERIC,
      TypeEnum.INTEGER,
      TypeEnum.OBJECT,
      TypeEnum.REGEX,
      TypeEnum.STRING,
      TypeEnum.UNDEFINED,
    ];

    return prng.pickOne([
      ...new Set([...probabilities.keys(), ...genericTypes]),
    ]);
  }

  /**
   * Gets a random type proportional to its likelihood
   * @param id the id we want to get a random type for
   * @returns a string describing the type
   */
  getRandomTypeProportional(id: string): string {
    const probabilities = this.getTypeNode(id).getTypeProbabilities();

    if (probabilities.size === 0 || this._sum(probabilities.values()) === 0) {
      return this.getRandomType(id);
    }

    const matchingTypes = [...probabilities.entries()];
    const totalProbability = 1;

    const choice = prng.nextDouble(0, totalProbability);
    let index = 0;

    let chosenType: string;
    let probability: number;
    for ([chosenType, probability] of matchingTypes) {
      if (choice <= index + probability) {
        return chosenType;
      }

      index += probability;
    }

    return chosenType;
  }

  /**
   * Gets a the most likely type
   * @param id the id we want to get the most likely type for
   * @returns a string describing the type
   */
  getMostLikelyType(id: string): string {
    const probabilities = this.getTypeNode(id).getTypeProbabilities();

    if (probabilities.size === 0 || this._sum(probabilities.values()) === 0) {
      return this.getRandomType(id);
    }

    const matchingTypes = probabilities;

    let best: string = [...matchingTypes.keys()][0];

    for (const [type, probability] of matchingTypes.entries()) {
      if (probability > matchingTypes.get(best)) {
        best = type;
      }
    }

    return best;
  }

  calculateProbabilitiesForFile(
    filepath: string
  ): Map<string, Map<string, number>> {
    const map = new Map<string, Map<string, number>>();
    for (const [id, typeNode] of this._typeNodes.entries()) {
      if (!id.startsWith(filepath)) {
        continue;
      }
      map.set(id, typeNode.getTypeProbabilities());
    }

    return map;
  }
}
