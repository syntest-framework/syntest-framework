import { Objective } from "./Objective";

/**
 * Simply an extension of a map that always returns a number value instead of undefined.
 *
 * @author Dimitri Stallenberg
 */
export class Evaluation {
  objectives: Map<Objective, number>;

  constructor() {
    this.objectives = new Map<Objective, number>();
  }

  clear(): void {
    this.objectives.clear();
  }

  delete(key: Objective): boolean {
    return this.objectives.delete(key);
  }

  forEach(
    callbackfn: (
      value: number,
      key: Objective,
      map: Map<Objective, number>
    ) => void,
    thisArg?: any
  ): void {
    this.objectives.forEach(callbackfn, thisArg);
  }

  get(key: Objective): number {
    if (this.objectives.has(key)) {
      return this.objectives.get(key)!;
    }
    return Number.MAX_VALUE - 1;
  }

  has(key: Objective): boolean {
    return this.objectives.has(key);
  }

  set(key: Objective, value: number): this {
    this.objectives.set(key, value);
    return this;
  }

  size(): number {
    return this.objectives.size;
  }

  keys(): IterableIterator<Objective> {
    return this.objectives.keys();
  }

  values(): IterableIterator<number> {
    return this.objectives.values();
  }

  entries(): IterableIterator<[Objective, number]> {
    return this.objectives.entries();
  }
}
