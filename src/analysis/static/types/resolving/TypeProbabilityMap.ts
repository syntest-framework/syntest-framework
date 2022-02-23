import { Typing, TypingType } from "./Typing";
import { prng, Properties } from "@syntest/framework";

export class TypeProbabilityMap {

  private typeMap: Map<Typing, number>
  private total: number
  private changed: boolean

  private probabilityMap: Map<Typing, number>

  constructor() {
    this.typeMap = new Map()
    this.probabilityMap = new Map()
    this.total = 0
    this.changed = true
  }

  addType(type: Typing, value: number = 1) {
    if (value <= 0) {
      throw new Error("Type must be compatible")
    }

    this.typeMap.set(type, value)
    this.total += value
    this.changed = true

    // TODO maybe the values should stack when done multiple times
  }

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

    if (true) { // Properties.alsotryrandom) { TODO property
      total = total / 0.9
      this.probabilityMap.set({ type: TypingType.ANY }, 0.1)
    }

      // recalculate probabilityMap
    for (const obj of this.typeMap.keys()) {
      this.probabilityMap.set(obj, (this.typeMap.get(obj) / total))
    }

    this.changed = false
  }

  getProbability(type: Typing): number {
    this.calculateProbabilities()

    return this.probabilityMap.get(type)
  }

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

  keys = () => this.typeMap.keys()
}