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

import {
  arrayProperties,
  functionProperties,
  ObjectType,
  stringProperties,
} from "./Type";
import { TypeEnum } from "./TypeEnum";

/**
 * TypeNode class
 */
export class TypeNode {
  protected _id: string;
  protected _typeScores: Map<string, number>;
  protected _dependencyScores: Map<TypeNode, number>;
  protected _executionScores: Map<string, number>;
  protected _objectType: ObjectType;

  protected probabilities: Map<string, number>;

  constructor(id: string) {
    this._id = id;

    this._typeScores = new Map();
    this._dependencyScores = new Map();
    this._executionScores = new Map();
    this._objectType = new ObjectType();
  }

  // type scores
  public addTypeScore(type: TypeEnum, score = 1) {
    const currentScore = this._typeScores.get(type) ?? 0;
    this._typeScores.set(type, currentScore + score);
    this.probabilities = undefined;

    if (type === TypeEnum.NUMERIC) {
      this.addTypeScore(TypeEnum.INTEGER, score);
    }
  }

  // complex type scores
  public addPropertyType(property: string, propertyId: string) {
    // check if the property is from a string/array/function
    if (functionProperties.has(property)) {
      this.addTypeScore(TypeEnum.FUNCTION);
    }

    if (arrayProperties.has(property)) {
      this.addTypeScore(TypeEnum.ARRAY);
    }

    if (stringProperties.has(property)) {
      this.addTypeScore(TypeEnum.STRING);
    }

    this.addTypeScore(TypeEnum.OBJECT);

    this._objectType.properties.set(property, propertyId);
  }

  public addParameterType(index: number, parameterId: string, name: string) {
    this.addTypeScore(TypeEnum.FUNCTION);
    this._objectType.parameters.set(index, parameterId);
    this._objectType.parameterNames.set(index, name);
  }

  public addReturnType(returnId: string) {
    this.addTypeScore(TypeEnum.FUNCTION);
    this._objectType.return.add(returnId);
  }

  public addElementType(elementId: string) {
    this.addTypeScore(TypeEnum.ARRAY);
    this._objectType.elements.add(elementId);
  }

  // dependency score
  public addDependencyScore(dependency: TypeNode, score: number) {
    if (dependency === this) {
      // not allowed self loop
      return;
      // throw new Error(`ids should not be equal to add a relation id: ${id1}`);
    }

    const currentScore = this._dependencyScores.get(dependency) ?? 0;
    this._dependencyScores.set(dependency, currentScore + score);
    this.probabilities = undefined;
  }

  // execution score
  public addExecutionScore(typeId: string, typeEnum: TypeEnum, score = -1) {
    let type: string = typeEnum;

    if (this._id !== typeId) {
      type = `${typeId}<>${typeEnum}`;
    }

    const currentScore = this._executionScores.get(type) ?? 0;
    this._executionScores.set(type, currentScore + score);
    this.probabilities = undefined;
  }

  // merging
  public merge(other: TypeNode) {
    // first add all entries in 'this's maps to the 'other's maps
    // then set all 'this' maps equal to 'other' maps

    for (const [type, score] of this._typeScores.entries()) {
      const currentScore = other._typeScores.get(type) ?? 0;
      other._typeScores.set(type, currentScore + score);
    }

    for (const [dependency, score] of this._dependencyScores.entries()) {
      other.addDependencyScore(dependency, score);
    }

    for (const [type, score] of this._executionScores.entries()) {
      const currentScore = other._executionScores.get(type) ?? 0;
      other._executionScores.set(type, currentScore + score);
    }

    const mergedObjectType = other._objectType.merge(this._objectType);
    this._objectType = mergedObjectType;
    other._objectType = mergedObjectType;

    this._typeScores = other._typeScores;
    this._dependencyScores = other._dependencyScores;
    this._executionScores = other._executionScores;

    this.probabilities = undefined;
    other.probabilities = undefined;
  }

  // calculation
  getTypeProbabilities() {
    // This allows caching of type scores. The only problem is that when a score of a relation changes it will not recalculate for the current element (only for the relation element)
    if (!this.probabilities) {
      this.probabilities = this._calculateProbabilities();
    }

    return this.probabilities;
  }

  protected _calculateProbabilities(
    visitedDependencyPairs?: Map<TypeNode, Set<TypeNode>>
  ) {
    if (!visitedDependencyPairs) {
      visitedDependencyPairs = new Map();
    }

    let probabilities = new Map<string, number>();

    let totalScore = this._sum(this._typeScores.values());

    const relevantDependencies = new Set<TypeNode>();

    for (const [dependency, score] of this._dependencyScores.entries()) {
      if (dependency === this) {
        throw new Error("should never happen (self reference)");
      }

      if (
        (visitedDependencyPairs.has(this) &&
          visitedDependencyPairs.get(this).has(dependency)) ||
        (visitedDependencyPairs.has(dependency) &&
          visitedDependencyPairs.get(dependency).has(this))
      ) {
        // we have already visited this relation pair
        // this means that we have a cycle in the graph
        // we can safely ignore this relation
        continue;
      }

      relevantDependencies.add(dependency);
      totalScore += score;
    }

    if (totalScore === 0) {
      totalScore = 1;
    }

    for (const [type, score] of this._typeScores.entries()) {
      probabilities.set(type, score / totalScore);
    }

    // incorporate dependency scores
    probabilities = this._incorporateDependencyScores(
      probabilities,
      visitedDependencyPairs,
      relevantDependencies,
      totalScore
    );

    // incorporate execution scores
    probabilities = this._incorporateExecutionScores(probabilities);

    // normalize
    probabilities = this._normalizeProbabilities(probabilities);

    return probabilities;
  }

  protected _incorporateDependencyScores(
    probabilities: Map<string, number>,
    visitedDependencyPairs: Map<TypeNode, Set<TypeNode>>,
    relevantDependencies: Set<TypeNode>,
    totalScore: number
  ): Map<string, number> {
    for (const dependency of relevantDependencies) {
      // add to visited pairs
      visitedDependencyPairs.has(this)
        ? undefined
        : visitedDependencyPairs.set(this, new Set());
      visitedDependencyPairs.has(dependency)
        ? undefined
        : visitedDependencyPairs.set(dependency, new Set());
      visitedDependencyPairs.get(this).add(dependency);
      visitedDependencyPairs.get(dependency).add(this);

      // calculate probabilties
      const dependencyProbabilities = dependency._calculateProbabilities(
        visitedDependencyPairs
      );
      const dependencyScore = this._dependencyScores.get(dependency);
      const dependencyScalar = dependencyScore / totalScore;

      // add probabilities
      for (const [type, probability] of dependencyProbabilities.entries()) {
        let finalType = type;

        if (!type.includes("<>")) {
          // maybe should check for includes (or the inverse by checking for primitive types)
          // this will only add only the final relation id
          // the other method will add all relation id from the element to the final relation
          finalType = `${dependency._id}<>${type}`;
        }

        if (finalType.includes("<>") && finalType.split("<>")[0] === this._id) {
          // skip this is a self loop
          continue;
        }

        const currentValue: number = probabilities.get(finalType) ?? 0;

        probabilities.set(
          finalType,
          currentValue + probability * dependencyScalar
        );
      }
    }

    return probabilities;
  }

  protected _incorporateExecutionScores(
    probabilities: Map<string, number>
  ): Map<string, number> {
    // if there are no executionscores return
    if (this._executionScores.size <= 1) {
      return probabilities;
    }

    // ignore execution scores when probabilities are not available
    if (probabilities.size === 0) {
      return probabilities;
    }

    const combinedProbabilityMap = new Map<string, number>();

    let minValue = 0;
    for (const score of this._executionScores.values()) {
      minValue = Math.min(minValue, score);
    }

    let totalScore = 0;
    for (const type of probabilities.keys()) {
      let score = this._executionScores.get(type) ?? 0;
      score -= minValue;
      score += 1;
      totalScore += score;
    }

    if (totalScore < 0) {
      throw new Error("Total score should be positive but is negative");
    }

    if (totalScore === 0) {
      throw new Error("Total score should be positive but is zero");
    }

    if (Number.isNaN(totalScore)) {
      throw new TypeError("Total score should be positive but is NaN");
    }

    // incorporate execution score
    for (const type of probabilities.keys()) {
      let score = this._executionScores.get(type) ?? 0;
      score -= minValue;
      score += 1;

      const executionScoreDiscount = score / totalScore;
      const probability = probabilities.get(type);
      const newProbability = executionScoreDiscount * probability;

      combinedProbabilityMap.set(type, newProbability);
    }

    return combinedProbabilityMap;
  }

  protected _normalizeProbabilities(
    probabilities: Map<string, number>
  ): Map<string, number> {
    // normalize to 1
    let totalProbability = 0;
    for (const probability of probabilities.values()) {
      totalProbability += probability;
    }

    if (totalProbability === 0 || totalProbability === 1) {
      return probabilities;
    }

    const normalizedProbabilities = new Map<string, number>();
    for (const [type, probability] of probabilities.entries()) {
      normalizedProbabilities.set(type, probability / totalProbability);
    }

    return normalizedProbabilities;
  }

  private _sum(iterable: Iterable<number>) {
    return [...iterable].reduce(
      (total, currentValue) => total + currentValue,
      0
    );
  }

  get id() {
    return this._id;
  }

  get typeScores() {
    return this._typeScores;
  }

  get dependencyScores() {
    return this._dependencyScores;
  }

  get executionScores() {
    return this._executionScores;
  }

  get objectType() {
    return this._objectType;
  }
}
