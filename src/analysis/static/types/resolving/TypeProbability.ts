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
import { prng, Properties } from "@syntest/framework";
import { ComplexObject } from "../discovery/object/ComplexObject";

/**
 * Type Probability Map
 * Stores information about the probability a certain element/relation is a certain identifierDescription
 *
 * @author Dimitri Stallenberg
 */

export class TypeProbability {

  private id: string
  objectDescription: Map<string, ComplexObject>
  private objectPropertyTypes: Map<string, Map<string, TypeProbability>>

  private scores: Map<string, number>
  private probabilities: Map<string, number>

  private typeIsTypeProbability: Map<string, TypeProbability>

  totalScores: number
  scoresChanged: boolean

  private executionScores: Map<string, number>

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
    this.id = prng.uniqueId()

    this.objectDescription = new Map()
    this.objectPropertyTypes = new Map()
    this.scores = new Map()
    this.probabilities = new Map()
    this.typeIsTypeProbability = new Map()
    this.totalScores = 0
    this.scoresChanged = true

    this.executionScores = new Map()

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

    const total = this.totalScores
    this.probabilities = new Map()

    const preliminaryProbabilities = new Map()
      // recalculate probabilityMap
    for (const identifier of this.scores.keys()) {
      preliminaryProbabilities.set(identifier, (this.scores.get(identifier) / total))
    }
    this.scoresChanged = false


    // return

    for (const identifier of this.scores.keys()) {
      if (this.typeIsTypeProbability.has(identifier)) {
        this.typeIsTypeProbability.get(identifier).calculateProbabilities()
        const probs = this.typeIsTypeProbability.get(identifier).probabilities

        let divider = 1
        if (probs.has(this.id)) {
          divider = 1 - probs.get(this.id)
        }

        for (const key of probs.keys()) {
          if (this.id === key) {
            continue
          }
          if (!this.probabilities.has(key)) {
            this.probabilities.set(key, 0)
          }

          this.probabilities.set(key, this.probabilities.get(key) + preliminaryProbabilities.get(identifier) * (probs.get(key) / divider))
        }
      } else {
        if (!this.probabilities.has(identifier)) {
          this.probabilities.set(identifier, 0)
        }

        this.probabilities.set(identifier, this.probabilities.get(identifier) + preliminaryProbabilities.get(identifier))
      }
    }

    // incorporate execution scores
    // get min value
    let minValue = 0
    for (const key of this.executionScores.keys()) {
      minValue = Math.min(minValue, this.executionScores.get(key))
    }

    if (Properties['incorporate_execution_information'] && this.executionScores.size) {
      // calculate total
      let totalScore = 0
      for (const key of this.probabilities.keys()) {
        let value = this.executionScores.has(key) ? this.executionScores.get(key) : 0
        value += -minValue
        totalScore += value
      }

      if (totalScore) {
        // calculate probability and incorporate
        for (const key of this.probabilities.keys()) {
          let value = this.executionScores.has(key) ? this.executionScores.get(key) : 0
          value += -minValue

          const probability = value / totalScore

          this.probabilities.set(key, this.probabilities.get(key) * probability)
        }
      }
    }

    // normalize to one
    let totalProb = 0
    for (const key of this.probabilities.keys()) {
      totalProb += this.probabilities.get(key)
    }

    if (totalProb) {
      for (const key of this.probabilities.keys()) {
        this.probabilities.set(key, this.probabilities.get(key) / totalProb)
      }
    }
  }

  addExecutionScore(type: string, score: number) {
    if (!this.executionScores.has(type)) {
      this.executionScores.set(type, score)
    }

    this.scoresChanged = true
    this.executionScores.set(type, this.executionScores.get(type) + score)
  }

  /**
   * Gets a random identifierDescription from the probability map based on their likelyhood
   */
  getRandomType(): string {
    this.calculateProbabilities()

    if (!this.probabilities.size) {
      return TypeEnum.ANY
    }

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

  getHighestProbabilityType(): string {
    this.calculateProbabilities()

    if (!this.probabilities.size) {
      return TypeEnum.ANY
    }

    let best: string = this.probabilities.keys().next().value

    for (const obj of this.probabilities.keys()) {
      if (this.probabilities.get(obj) > this.probabilities.get(best)) {
        best = obj
      }
    }

    if (this.typeIsTypeProbability.has(best)) {
      return this.typeIsTypeProbability.get(best).getHighestProbabilityType()
    }

    return best
  }

  keys = () => this.scores.keys()

  getIdentifier(): string {
    return this.id
  }
}