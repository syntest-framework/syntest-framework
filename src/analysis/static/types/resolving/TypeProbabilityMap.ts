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
import { Typing, TypingType } from "./Typing";
import { prng } from "@syntest/framework";

/**
 * Type Probability Map
 * Stores information about the probability a certain element/relation is a certain identifierDescription
 *
 * @author Dimitri Stallenberg
 */
export class TypeProbabilityMap {

  private typeMap: Map<string, Typing>
  private total: number
  private changed: boolean

  private scoreMap: Map<string, number>
  private probabilityMap: Map<Typing | TypeProbabilityMap, number>

  /**
   * Constructor
   */
  constructor() {
    this.typeMap = new Map()
    this.scoreMap = new Map()
    this.probabilityMap = new Map()
    this.total = 0
    this.changed = true
  }

  getIdentifier(type: Typing): string {
    let identifier = `${type.type}`

    if (type.object) {
      identifier += '-' + type.object.name
    }

    return identifier
  }

  /**
   * Add a (new) identifierDescription to the probability map
   * @param type the (new) identifierDescription
   * @param value the score of identifierDescription (higher score means higher probability)
   */
  addType(type: Typing, value = 1) {
    if (value <= 0) {
      throw new Error("Type must be compatible")
    }

    const identifier = this.getIdentifier(type)

    if (!this.scoreMap.has(identifier)) {
      this.scoreMap.set(identifier, 0)
    }

    this.scoreMap.set(identifier, this.scoreMap.get(identifier) + value)
    // override with latest identifierDescription
    this.typeMap.set(identifier, type)

    this.total += value
    this.changed = true
  }

  /**
   * Calculates the actual probabilities for each identifierDescription based on the given scores
   */
  calculateProbabilities() {
    if (!this.changed) {
      return
    }

    if (this.typeMap.size === 0) {
      this.probabilityMap.set({ type: TypingType.ANY }, 1)
      return
    }

    let total = this.total
    this.probabilityMap = new Map()

    // this ensures that there is a chance of trying a random other identifierDescription
    if (true) { // Properties.alsotryrandom) { TODO property
      total = total / 0.9
      this.probabilityMap.set({ type: TypingType.ANY }, 0.1)
    }

      // recalculate probabilityMap
    for (const identifier of this.typeMap.keys()) {
      this.probabilityMap.set(this.typeMap.get(identifier), (this.scoreMap.get(identifier) / total))
    }

    this.changed = false
  }

  /**
   * Gets the probability of the given identifierDescription
   * @param type the identifierDescription
   */
  getProbability(type: Typing): number {
    this.calculateProbabilities()

    return this.probabilityMap.get(type)
  }

  /**
   * Gets a random identifierDescription from the probability map based on their likelyhood
   */
  getRandomType(): Typing {
    this.calculateProbabilities()

    const choice = prng.nextDouble(0, 1)
    let index = 0

    for (const obj of this.probabilityMap.keys()) {
      const probability = this.probabilityMap.get(obj)

      if (choice <= index + probability) {
        return obj
      }

      index += probability
    }

    return this.probabilityMap.keys().next().value
  }

  getEliteType(): Typing {
    this.calculateProbabilities()

    let best: Typing = this.probabilityMap.keys().next().value

    for (const obj of this.probabilityMap.keys()) {
      if (this.probabilityMap.get(obj) > this.probabilityMap.get(best)) {
        best = obj
      }
    }

    return best
  }

  getDynamicType(): Typing {
    this.calculateProbabilities()

    const first: Typing = this.probabilityMap.keys().next().value

    // TODO

    return first
  }

  keys = () => this.typeMap.keys()
}