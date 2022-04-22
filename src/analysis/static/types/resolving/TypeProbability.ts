/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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
import { TypeEnum } from "./TypeEnum";
import { prng } from "@syntest/framework";
import { ComplexObject } from "../discovery/object/ComplexObject";

/**
 * Type Probability Map
 * Stores information about the probability a certain element/relation is a certain identifierDescription
 *
 * @author Dimitri Stallenberg
 */

  // TODO make recursive possible (typeProbability)
export class TypeProbability {
  private objectDescription: Map<string, ComplexObject>
  private objectPropertyTypes: Map<string, Map<string, TypeProbability>>

  private scores: Map<string, number>
  private probabilities: Map<string, number>

  private typeIsTypeProbability: Map<string, TypeProbability>

  totalScores: number
  scoresChanged: boolean

  getObjectDescription(type: string): ComplexObject {
    return this.objectDescription.get(type)
  }

  getPropertyTypes(type: string): Map<string, TypeProbability> {
    return this.objectPropertyTypes.get(type)
  }

  /**
   * Constructor
   */
  constructor(initialTypes?: ([string | TypeProbability, number, (ComplexObject | null)])[]) {
    this.objectDescription = new Map()
    this.objectPropertyTypes = new Map()
    this.scores = new Map()
    this.probabilities = new Map()
    this.typeIsTypeProbability = new Map()
    this.totalScores = 0
    this.scoresChanged = true

    if (initialTypes) {
      initialTypes.forEach((x) => this.addType(x[0], x[1], x[2]))
    }
  }

  /**
   * Add a (new) identifierDescription to the probability map
   * @param type the (new) identifierDescription
   * @param score the score of identifierDescription (higher score means higher probability)
   */
  addType(type: string | TypeProbability, score, objectDescription: ComplexObject = null, propertyTypes: Map<string, TypeProbability> = null) {
    if (score <= 0) {
      throw new Error("Type must be compatible")
    }

    if (type instanceof TypeProbability) {
      const id = type.getIdentifier()

      this.typeIsTypeProbability.set(id, type)

      type = id
    }

    if (!this.scores.has(type)) {
      this.scores.set(type, 0)
    }

    if (objectDescription) {
      this.objectDescription.set(type, objectDescription)

      if (propertyTypes) {
        this.objectPropertyTypes.set(type, propertyTypes)
      } else {
        this.objectPropertyTypes.set(type, new Map<string, TypeProbability>())
      }
    }

    this.scores.set(type, this.scores.get(type) + score)

    this.totalScores += score
    this.scoresChanged = true
  }

  /**
   * Calculates the actual probabilities for each identifierDescription based on the given scores
   */
  calculateProbabilities() {
    if (!this.scoresChanged) {
      return
    }

    if (this.scores.size === 0) {
      this.probabilities.set(TypeEnum.ANY, 1)
      return
    }

    let total = this.totalScores
    this.probabilities = new Map()

    // this ensures that there is a chance of trying a random other identifierDescription
    if (true) { // Properties.alsotryrandom) { TODO property
      total = total / 0.9
      this.probabilities.set(TypeEnum.ANY, 0.1)
    }

      // recalculate probabilityMap
    for (const identifier of this.scores.keys()) {
      this.probabilities.set(identifier, (this.scores.get(identifier) / total))
    }

    this.scoresChanged = false
  }

  /**
   * Gets the probability of the given identifierDescription
   * @param type the type
   */
  getProbability(type: TypeEnum | string): number {
    this.calculateProbabilities()

    return this.probabilities.get(type)
  }

  /**
   * Gets a random identifierDescription from the probability map based on their likelyhood
   */
  getRandomType(): string {
    this.calculateProbabilities()

    const choice = prng.nextDouble(0, 1)
    let index = 0

    for (const type of this.probabilities.keys()) {
      const probability = this.probabilities.get(type)

      if (choice <= index + probability) {
        if (this.typeIsTypeProbability.has(type)) {
          return this.typeIsTypeProbability.get(type).getRandomType()
        }
        return type
      }

      index += probability
    }

    const type = this.probabilities.keys().next().value

    if (this.typeIsTypeProbability.has(type)) {
      return this.typeIsTypeProbability.get(type).getRandomType()
    }

    return type
  }

  getEliteType(): string {
    this.calculateProbabilities()

    let best: string = this.probabilities.keys().next().value

    for (const obj of this.probabilities.keys()) {
      if (this.probabilities.get(obj) > this.probabilities.get(best)) {
        best = obj
      }
    }

    if (this.typeIsTypeProbability.has(best)) {
      return this.typeIsTypeProbability.get(best).getEliteType()
    }

    return best
  }

  getDynamicType(): string {
    this.calculateProbabilities()

    const first: string = this.probabilities.keys().next().value

    // TODO

    if (this.typeIsTypeProbability.has(first)) {
      return this.typeIsTypeProbability.get(first).getEliteType()
    }

    return first
  }

  keys = () => this.scores.keys()

  getIdentifier(): string {
    let id = ''

    // TODO check ordering
    for (const key of this.scores.keys()) {
      if (this.typeIsTypeProbability.has(key)) {
        id += this.typeIsTypeProbability.get(key).getIdentifier()
      } else {
        id += key
      }
    }

    return id
  }
}